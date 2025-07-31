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

  const { collectiveId  } = await params;

  try {
    // Check if the current user is a member of the collective
    const collectiveMember = await prisma.collectiveMember.findFirst({
      where: {
        userId: session.user.id,
        collectiveId: collectiveId,
      },
    });

    if (!collectiveMember) {
      return new NextResponse("Forbidden: Not a member of this collective", { status: 403 });
    }

    const members = await prisma.collectiveMember.findMany({
      where: {
        collectiveId: collectiveId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching collective members:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ collectiveId: string  }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { collectiveId  } = await params;
  const { email, role } = await request.json();

  if (!email || !role) {
    return new NextResponse("Email and role are required", { status: 400 });
  }

  // Validate role
  const allowedRoles = ["member", "admin", "owner"];
  if (!allowedRoles.includes(role)) {
    return new NextResponse("Invalid role specified", { status: 400 });
  }

  try {
    // Check if the current user is an owner or admin of the collective
    const collectiveMember = await prisma.collectiveMember.findFirst({
      where: {
        userId: session.user.id,
        collectiveId: collectiveId,
      },
    });

    if (!collectiveMember || (collectiveMember.role !== "owner" && collectiveMember.role !== "admin")) {
      return new NextResponse("Forbidden: Only collective owners or admins can add members", { status: 403 });
    }

    // Find the user to be added
    const userToAdd = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!userToAdd) {
      return new NextResponse("User with this email not found", { status: 404 });
    }

    // Check if the user is already a member of this collective
    const existingMembership = await prisma.collectiveMember.findFirst({
      where: {
        userId: userToAdd.id,
        collectiveId: collectiveId,
      },
    });

    if (existingMembership) {
      return new NextResponse("User is already a member of this collective", { status: 409 });
    }

    // Add the user to the collective
    const newCollectiveMember = await prisma.collectiveMember.create({
      data: {
        collectiveId: collectiveId,
        userId: userToAdd.id,
        role: role,
      },
      include: {
        user: { select: { name: true, email: true } },
      }, // Include user details for the response
    });

    return NextResponse.json(newCollectiveMember, { status: 201 });
  } catch (error) {
    console.error("Error adding member to collective:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
