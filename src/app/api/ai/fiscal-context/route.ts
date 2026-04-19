import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import FiscalContextService from "@/lib/fiscal-context";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get comprehensive fiscal profile for the user
    const fiscalProfile = await FiscalContextService.getUserFiscalProfile(session.user.id);

    return NextResponse.json(fiscalProfile);
  } catch (error) {
    console.error("Error fetching fiscal context:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { includeForecasting } = await request.json();

    // Get fiscal profile with optional advanced forecasting
    const fiscalProfile = await FiscalContextService.getUserFiscalProfile(session.user.id);

    // Add advanced forecasting if requested
    if (includeForecasting) {
      // This could include ML-based predictions, trend analysis, etc.
      // For now, we'll return the standard profile
    }

    return NextResponse.json(fiscalProfile);
  } catch (error) {
    console.error("Error fetching enhanced fiscal context:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}