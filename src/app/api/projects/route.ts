import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const collectiveId = searchParams.get('collectiveId');

  try {
    const whereClause = collectiveId 
      ? { collectiveId }
      : {
          collective: {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        };

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        collective: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        },
        client: true,
        invoices: {
          include: {
            items: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { name, description, collectiveId, clientId, budget, startDate, endDate } = await request.json();

    if (!name || !collectiveId || !clientId) {
      return new NextResponse("Name, collective, and client are required", { status: 400 });
    }

    // Verify user is member of the collective
    const collective = await prisma.collective.findFirst({
      where: {
        id: collectiveId,
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    });

    if (!collective) {
      return new NextResponse("Access denied to this collective", { status: 403 });
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        collectiveId,
        clientId,
        budget: budget ? parseFloat(budget) : null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        collective: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        },
        client: true,
        invoices: true
      }
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}