import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function DELETE(request: Request, { params }: { params: Promise<{ collectiveId: string, clientId: string  }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { collectiveId, clientId  } = await params;

  try {
    // Verify that the user is a member of the collective
    const collectiveMember = await prisma.collectiveMember.findFirst({
      where: {
        collectiveId: collectiveId,
        userId: session.user.id,
      },
    });

    if (!collectiveMember) {
      return new NextResponse("Forbidden: You are not a member of this collective", { status: 403 });
    }

    // Check if the assignment exists
    const existingAssignment = await prisma.collectiveClient.findUnique({
      where: {
        collectiveId_clientId: {
          collectiveId: collectiveId,
          clientId: clientId,
        },
      },
    });

    if (!existingAssignment) {
      return new NextResponse("Client not assigned to this collective", { status: 404 });
    }

    await prisma.collectiveClient.delete({
      where: {
        collectiveId_clientId: {
          collectiveId: collectiveId,
          clientId: clientId,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error unassigning client from collective:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
