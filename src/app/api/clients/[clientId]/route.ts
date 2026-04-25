import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import { z } from 'zod';
import { evaluateInvoiceReadiness } from "@/domains/invoices/invoice-readiness";


const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  siret: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  tvaNumber: z.string().optional().or(z.literal('')),
  legalStatus: z.string().optional().or(z.literal('')),
  shareCapital: z.string().optional().or(z.literal('')),
  contactName: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

export async function GET(request: Request, { params }: { params: Promise<{ clientId: string  }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { clientId  } = await params;

  try {
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
        userId: session.user.id, // Ensure client belongs to the user
      },
    });

    if (!client) {
      return new NextResponse("Client not found or you don't have access", { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ clientId: string  }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { clientId  } = await params;

  try {
    const body = await request.json();
    const validation = clientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const updatedClient = await prisma.client.update({
      where: {
        id: clientId,
        userId: session.user.id,
      },
      data: validation.data,
    });

    // Re-evaluate readiness for all linked non-issued invoices
    const linkedInvoices = await prisma.invoice.findMany({
      where: { clientId, userId: session.user.id, workflowStatus: { not: 'issued' } },
      include: { items: true },
    });

    await Promise.all(
      linkedInvoices.map(async (inv) => {
        const readiness = evaluateInvoiceReadiness({
          clientName: inv.clientName || updatedClient.name,
          clientAddress: inv.clientAddress || updatedClient.address,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          issuerName: inv.issuerName,
          issuerAddress: inv.issuerAddress,
          legalMentions: inv.legalMentions,
          items: inv.items.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        });

        const newStatus = readiness.status === 'ready'
          ? (inv.workflowStatus === 'blocked' ? 'collecting_data' : inv.workflowStatus)
          : 'blocked';

        if (newStatus !== inv.workflowStatus) {
          await prisma.invoice.update({
            where: { id: inv.id },
            data: {
              workflowStatus: newStatus as any,
              facturxValidationErrors: readiness.status === 'blocked' ? (readiness.blockingReasons as any) : undefined,
            },
          });
        }
      })
    );

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ clientId: string  }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { clientId  } = await params;

  try {
    await prisma.client.delete({
      where: {
        id: clientId,
        userId: session.user.id, // Ensure client belongs to the user
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting client:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
