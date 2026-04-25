import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { extractFromImage, extractFromText, isLLMConfigured } from '@/lib/llm-router';
import { isPro } from '@/lib/subscription';

const EXTRACTION_PROMPT = `Tu es un extracteur de données de facturation pour une plateforme de facturation française.

Extrais les champs suivants du document fourni. Retourne UNIQUEMENT du JSON valide — pas de markdown, pas d'explication.

Format de sortie requis :
{
  "clientName": string ou null,
  "clientAddress": string ou null,
  "clientSiret": string ou null,
  "clientEmail": string ou null,
  "invoiceDate": "YYYY-MM-DD" ou null,
  "dueDate": "YYYY-MM-DD" ou null,
  "items": [
    {
      "description": string,
      "quantity": number,
      "unitPrice": number,
      "tvaRate": number
    }
  ],
  "currency": "EUR",
  "notes": string ou null
}

Règles :
- items est toujours un tableau, même s'il n'y a qu'une seule ligne
- unitPrice est le prix HORS TAXE (HT)
- tvaRate est le pourcentage de TVA (ex. 20 pour 20%, 0 pour micro-entrepreneur)
- Si un champ est absent du document, mettre null
- Les dates doivent être au format YYYY-MM-DD
- Si tu vois un total TTC et un taux de TVA mais pas de prix HT, calculer HT = TTC / (1 + taux/100)
- clientSiret : nombre de 14 chiffres uniquement, sans espaces
- Extraire depuis : devis, propositions, contrats, factures, emails, feuilles de temps`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await isPro(session.user.id))) {
    return NextResponse.json({
      error: "L'extraction IA est réservée au plan Pro.",
      upgrade: true,
      upgradeUrl: '/dashboard/settings#billing',
    }, { status: 402 });
  }

  if (!isLLMConfigured()) {
    return NextResponse.json({ error: 'AI extraction not configured' }, { status: 503 });
  }

  // Rate limit: 20 extractions per user per day
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const extractionsToday = await prisma.billingTrigger.count({
    where: { userId: session.user.id, triggerType: 'uploaded_doc', createdAt: { gte: todayStart } },
  });
  if (extractionsToday >= 20) {
    return NextResponse.json({ error: 'Limite de 20 extractions par jour atteinte.' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const maxBytes = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 });
    }

    const mimeType = file.type || 'application/pdf';
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload a PDF or image (PNG, JPEG, WEBP).' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let raw: string;

    if (isImage) {
      // Vision model — direct image understanding
      const base64 = buffer.toString('base64');
      raw = await extractFromImage(base64, mimeType, EXTRACTION_PROMPT, session.user.id);
    } else {
      // PDF — extract text first, then use Mistral (French text model)
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      const pdfText = pdfData.text?.trim();

      if (!pdfText || pdfText.length < 20) {
        return NextResponse.json(
          { error: 'Le PDF ne contient pas de texte lisible. Essayez une image scannée.' },
          { status: 422 }
        );
      }

      raw = await extractFromText(pdfText, EXTRACTION_PROMPT, session.user.id);
    }

    // Strip markdown fences if model wraps in ```json
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    let extracted: unknown;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      console.error('LLM extraction: could not parse JSON', raw);
      return NextResponse.json(
        { error: 'Extraction échouée — le document ne contient peut-être pas de données de facturation.' },
        { status: 422 }
      );
    }

    // Log extraction for rate limiting
    await prisma.billingTrigger.create({
      data: { userId: session.user.id, triggerType: 'uploaded_doc', sourceDescription: file.name },
    });

    return NextResponse.json({ extracted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Extraction error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
