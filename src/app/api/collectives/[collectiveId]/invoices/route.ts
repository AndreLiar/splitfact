import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  totalAmount: z.number().positive("Total amount must be positive"),
  dueDate: z.string().datetime("Due date must be a valid date string"),
  shares: z.array(z.object({
    userId: z.string().min(1, "User ID is required"),
    shareType: z.enum(["percent", "fixed"]),
    shareValue: z.number().positive("Share value must be positive"),
  })).min(1, "At least one share is required"),
});

export async function GET(request: Request, { params }: { params: Promise<{ collectiveId: string  }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { collectiveId } = await params;

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        collectiveId: collectiveId,
        collective: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      include: {
        client: true,
        shares: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ collectiveId: string  }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { collectiveId  } = await params;
  const userId = session.user.id;

  try {
    const body = await request.json();
    const validatedData = invoiceSchema.parse(body);

    // Get collective information
    const collective = await prisma.collective.findUnique({
      where: { id: collectiveId },
    });

    if (!collective) {
      return new NextResponse("Collective not found", { status: 404 });
    }

    // Verify that the user is a member of the collective
    const collectiveMember = await prisma.collectiveMember.findFirst({
      where: {
        collectiveId: collectiveId,
        userId: userId,
      },
    });

    if (!collectiveMember) {
      return new NextResponse("Forbidden: You are not a member of this collective", { status: 403 });
    }

    // Verify that the client belongs to this collective
    const client = await prisma.client.findUnique({
      where: {
        id: validatedData.clientId,
      },
      include: {
        collectiveClients: {
          where: {
            collectiveId: collectiveId,
          },
        },
      },
    });

    if (!client || client.collectiveClients.length === 0) {
      return new NextResponse("Client not found or does not belong to this collective", { status: 400 });
    }

    // Calculate actual amounts for shares and ensure they sum up to totalAmount
    let totalCalculatedAmount = 0;
    const sharesWithCalculatedAmount = validatedData.shares.map(share => {
      let calculatedAmount;
      if (share.shareType === "percent") {
        calculatedAmount = validatedData.totalAmount * (share.shareValue / 100);
      } else {
        calculatedAmount = share.shareValue;
      }
      totalCalculatedAmount += calculatedAmount;
      return { ...share, calculatedAmount };
    });

    // Basic validation for total amount (can be more robust)
    if (Math.abs(totalCalculatedAmount - validatedData.totalAmount) > 0.01) { // Allow for floating point inaccuracies
      return new NextResponse("Sum of shares does not match total amount", { status: 400 });
    }

    // Generate invoice number
    const invoiceNumber = `INV-COL-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    
    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNumber,
        invoiceDate: new Date(),
        collectiveId: collectiveId,
        clientId: validatedData.clientId,
        userId: userId, // Add the user who created the invoice
        totalAmount: validatedData.totalAmount,
        dueDate: new Date(validatedData.dueDate),
        issuerName: collective.name,
        issuerAddress: 'Collective Address',
        clientName: client.name,
        clientAddress: client.address,
        clientSiret: client.siret,
        clientTvaNumber: client.tvaNumber,
        shares: {
          create: sharesWithCalculatedAmount.map(share => ({
            userId: share.userId,
            shareType: share.shareType,
            shareValue: share.shareValue,
            calculatedAmount: share.calculatedAmount,
          })),
        },
      },
    });

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("Error creating invoice:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
