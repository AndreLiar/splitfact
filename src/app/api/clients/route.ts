import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const clients = await prisma.client.findMany({
      where: {
        userId: session.user.id,
      },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { name, email, siret, address, tvaNumber, legalStatus, shareCapital, contactName, phone } = await request.json();

    if (!name) {
      return new NextResponse("Client name is required", { status: 400 });
    }

    const newClient = await prisma.client.create({
      data: {
        name,
        email,
        siret,
        address,
        tvaNumber,
        legalStatus,
        shareCapital,
        contactName,
        phone,
        userId: session.user.id,
      },
    });
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
