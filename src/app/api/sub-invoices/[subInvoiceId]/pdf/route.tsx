import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { renderToStream } from '@react-pdf/renderer';

import cloudinary from '@/lib/cloudinary';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ subInvoiceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subInvoiceId } = await params;

  try {
    const subInvoice = await prisma.subInvoice.findUnique({
      where: { id: subInvoiceId, receiverId: session.user.id },
      include: {
        issuer: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
        parentInvoice: { select: { id: true, invoiceNumber: true, collective: { select: { name: true } } } },
      },
    });

    if (!subInvoice) {
      return NextResponse.json({ error: 'Sub-invoice not found' }, { status: 404 });
    }

    const SubInvoicePdf = (await import('@/app/components/SubInvoicePdf')).default;
    const doc = <SubInvoicePdf subInvoice={subInvoice} />;
    const stream = await renderToStream(doc);
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const buffers: Uint8Array[] = [];
      stream.on('data', (chunk) => buffers.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(buffers)));
      stream.on('error', (error) => reject(error));
    });

    const uploadResult = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${buffer.toString('base64')}`,
      {
        folder: 'sub-invoices',
        public_id: `sub-invoice-${subInvoice.id}`,
        resource_type: 'raw',
      }
    );

    await prisma.subInvoice.update({
      where: { id: subInvoice.id },
      data: { pdfUrl: uploadResult.secure_url },
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="sub-invoice-${subInvoice.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating or uploading sub-invoice PDF:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
