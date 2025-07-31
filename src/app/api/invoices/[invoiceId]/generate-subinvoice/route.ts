import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import { generateSubInvoices } from "@/lib/subInvoiceGenerator";

export async function POST(request: Request, { params }: { params: Promise<{ invoiceId: string  }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { invoiceId } = await params;

  try {
    const result = await generateSubInvoices({ invoiceId, sessionUserId: session.user.id });

    if (result.message === 'No sub-invoices to generate for this invoice.') {
      return new NextResponse(result.message, { status: 200 });
    }

    return NextResponse.json(result.subInvoices, { status: 201 });
  } catch (error: any) {
    
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
