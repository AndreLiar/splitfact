import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get("reportId");

  if (!reportId) {
    return new NextResponse("Report ID is required", { status: 400 });
  }

  try {
    const urssafReport = await prisma.urssafReport.findUnique({
      where: { id: reportId, userId: userId },
    });

    if (!urssafReport) {
      return new NextResponse("Report not found or you do not have access to it.", { status: 404 });
    }

    const reportData = urssafReport.reportData as any;

    // Convert JSON data to CSV format
    let csvContent = "";
    const headers = Object.keys(reportData);
    csvContent += headers.join(";") + "\n";

    const values = headers.map(header => {
      const value = reportData[header];
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value).replace(/"/g, ""); // Handle nested objects/arrays
      }
      return String(value);
    });
    csvContent += values.join(";") + "\n";

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="urssaf_report_${reportData.period.replace(/ /g, '_')}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error generating URSSAF CSV report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}