import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId } = await params;

  try {
    // Check if the invoice exists and user has access in one query
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: session.user.id },
      include: {
        client: true,
        collective: true,
        items: true,
        shares: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!invoice) {
      // Check if invoice exists at all (for better error message)
      const invoiceExists = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: { id: true }
      });
      
      if (!invoiceExists) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      } else {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId } = await params;
  const body = await req.json();

  try {
    // First check if user owns this invoice
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: session.user.id },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Build update data — only include fields explicitly sent in body
    const editableStatuses: string[] = ['triggered', 'collecting_data', 'blocked', 'ready_for_review'];
    const isDraft = editableStatuses.includes(existingInvoice.workflowStatus);
    const editableFields = isDraft ? {
      ...(body.clientName !== undefined && { clientName: body.clientName }),
      ...(body.clientAddress !== undefined && { clientAddress: body.clientAddress }),
      ...(body.clientEmail !== undefined && { clientEmail: body.clientEmail }),
      ...(body.clientSiret !== undefined && { clientSiret: body.clientSiret }),
      ...(body.clientTvaNumber !== undefined && { clientTvaNumber: body.clientTvaNumber }),
      ...(body.issuerName !== undefined && { issuerName: body.issuerName }),
      ...(body.issuerAddress !== undefined && { issuerAddress: body.issuerAddress }),
      ...(body.issuerSiret !== undefined && { issuerSiret: body.issuerSiret }),
      ...(body.issuerTva !== undefined && { issuerTva: body.issuerTva }),
      ...(body.legalMentions !== undefined && { legalMentions: body.legalMentions }),
      ...(body.paymentTerms !== undefined && { paymentTerms: body.paymentTerms }),
      ...(body.dueDate !== undefined && { dueDate: new Date(body.dueDate) }),
      ...(body.invoiceDate !== undefined && { invoiceDate: new Date(body.invoiceDate) }),
    } : {};

    // Update the invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ...editableFields,
        paymentStatus: body.paymentStatus,
        // If marking as paid, also update status
        ...(body.paymentStatus === 'paid' && { status: 'paid' }),
      },
      include: {
        client: true,
        collective: true,
        items: true,
        shares: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    // If marking as paid, also update all related sub-invoices
    if (body.paymentStatus === 'paid') {
      const subInvoiceUpdate = await prisma.subInvoice.updateMany({
        where: { parentInvoiceId: invoiceId },
        data: { 
          paymentStatus: 'paid',
          status: 'paid'
        },
      });
      console.log(`[Manual Payment] Updated ${subInvoiceUpdate.count} sub-invoices for invoice ${invoiceId} to paid status.`);
    }

    // If marking as pending (unpaid), also update all related sub-invoices
    if (body.paymentStatus === 'pending') {
      await prisma.subInvoice.updateMany({
        where: { parentInvoiceId: invoiceId },
        data: { 
          paymentStatus: 'pending',
          // Don't change status to pending, keep it as finalized if it was finalized
        },
      });
      console.log(`[Manual Payment] Updated sub-invoices for invoice ${invoiceId} to pending status.`);
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
