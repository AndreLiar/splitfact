import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EXTRACTION_PROMPT = `You are an invoice data extractor for a French invoicing platform.

Extract the following fields from the document provided. Return ONLY valid JSON — no markdown, no explanation.

Required output shape:
{
  "clientName": string or null,
  "clientAddress": string or null,
  "clientSiret": string or null,
  "clientEmail": string or null,
  "invoiceDate": "YYYY-MM-DD" or null,
  "dueDate": "YYYY-MM-DD" or null,
  "items": [
    {
      "description": string,
      "quantity": number,
      "unitPrice": number,
      "tvaRate": number
    }
  ],
  "currency": "EUR",
  "notes": string or null
}

Rules:
- items is always an array, even if there is only one line item
- unitPrice is the price EXCLUDING tax (HT)
- tvaRate is the TVA percentage (e.g. 20 for 20%, 0 for micro-entrepreneur)
- If a field is not present in the document, set it to null
- Dates must be in YYYY-MM-DD format
- If you see a total TTC and a TVA rate but no HT price, calculate HT = TTC / (1 + rate/100)
- clientSiret: 14-digit number only, no spaces
- Extract from: quotes, proposals, contracts, invoices, emails, timesheets`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'application/pdf';

    // Use GPT-4o vision for image/PDF extraction
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload a PDF or image (PNG, JPEG, WEBP).' },
        { status: 400 }
      );
    }

    let response;

    if (isImage) {
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACTION_PROMPT },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
              },
            ],
          },
        ],
      });
    } else {
      // PDF: send as file input via the files API
      // GPT-4o supports PDF via base64 image_url with mime application/pdf
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACTION_PROMPT },
              {
                type: 'image_url',
                image_url: { url: `data:application/pdf;base64,${base64}`, detail: 'high' },
              },
            ],
          },
        ],
      });
    }

    const raw = response.choices[0]?.message?.content ?? '';

    // Strip markdown fences if model wraps in ```json
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    let extracted: unknown;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      console.error('AI extraction: could not parse JSON', raw);
      return NextResponse.json(
        { error: 'Extraction failed — document may not contain invoice data.' },
        { status: 422 }
      );
    }

    // Log extraction for rate limiting
    await prisma.billingTrigger.create({
      data: { userId: session.user.id, triggerType: 'uploaded_doc', sourceDescription: file.name },
    });

    return NextResponse.json({ extracted });
  } catch (err: any) {
    console.error('Extraction error:', err);
    return NextResponse.json(
      { error: err.message ?? 'Internal Server Error' },
      { status: 500 }
    );
  }
}
