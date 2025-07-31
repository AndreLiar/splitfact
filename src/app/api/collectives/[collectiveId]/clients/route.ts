import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ collectiveId: string  }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { collectiveId } = await params;

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

    const collectiveClients = await prisma.collectiveClient.findMany({
      where: {
        collectiveId: collectiveId,
      },
      include: {
        client: true, // Include the full client object
      },
    });

    // Return only the client objects
    const clients = collectiveClients.map(cc => cc.client);

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching collective clients:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ collectiveId: string  }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { collectiveId } = await params;
  const { clientId } = await request.json();

  if (!clientId) {
    return new NextResponse("Client ID is required", { status: 400 });
  }

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

    // Ensure the client exists and belongs to the current user
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
        userId: session.user.id,
      },
    });

    if (!client) {
      return new NextResponse("Client not found or does not belong to you", { status: 404 });
    }

    // Check if the client is already assigned to this collective
    const existingAssignment = await prisma.collectiveClient.findUnique({
      where: {
        collectiveId_clientId: {
          collectiveId: collectiveId,
          clientId: clientId,
        },
      },
    });

    if (existingAssignment) {
      return new NextResponse("Client already assigned to this collective", { status: 409 });
    }

    const newCollectiveClient = await prisma.collectiveClient.create({
      data: {
        collectiveId: collectiveId,
        clientId: clientId,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json(newCollectiveClient.client, { status: 201 });
  } catch (error) {
    console.error("Error assigning client to collective:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
