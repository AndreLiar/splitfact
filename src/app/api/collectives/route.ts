import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const collectives = await prisma.collective.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        invoices: {
          include: {
            client: true,
          },
        },
      },
    });
    return NextResponse.json(collectives);
  } catch (error) {
    console.error("Error fetching collectives:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { name } = await request.json();

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const newCollective = await prisma.collective.create({
      data: {
        name,
        createdById: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "owner",
          },
        },
      },
    });
    return NextResponse.json(newCollective, { status: 201 });
  } catch (error) {
    console.error("Error creating collective:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
