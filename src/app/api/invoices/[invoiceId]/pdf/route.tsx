import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { renderToStream } from '@react-pdf/renderer';
import InvoicePdf from '@/app/components/InvoicePdf';
import cloudinary from '@/lib/cloudinary';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, userId: session.user.id },
      include: {
        client: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const doc = <InvoicePdf invoice={invoice} />;
    const stream = await renderToStream(doc);
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const buffers: Uint8Array[] = [];
      stream.on('data', (chunk) => buffers.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(buffers)));
      stream.on('error', (error) => reject(error));
    });

    // Instead of uploading to Cloudinary, stream the PDF back to the client
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
