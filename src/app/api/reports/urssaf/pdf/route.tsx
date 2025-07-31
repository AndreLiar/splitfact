import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { renderToStream } from '@react-pdf/renderer';
import UrssafReportPdf from '@/app/components/UrssafReportPdf';

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

    const pdfStream = await renderToStream(<UrssafReportPdf data={reportData} />);

    return new NextResponse(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="urssaf_report_${reportData.period.replace(/ /g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating URSSAF PDF report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
