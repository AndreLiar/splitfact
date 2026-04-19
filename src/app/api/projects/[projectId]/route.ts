import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";


export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const params = await context.params;
    const { projectId } = params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        collective: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      },
      include: {
        collective: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        client: true,
        invoices: {
          include: {
            items: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const params = await context.params;
    const { projectId } = params;
    const { name, description, status, budget, startDate, endDate } = await request.json();

    // Verify user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        collective: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        description,
        status,
        budget: budget ? parseFloat(budget) : null,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        collective: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
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
      }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const params = await context.params;
    const { projectId } = params;

    // Verify user has access to this project and check if they're an admin/owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        collective: {
          members: {
            some: {
              userId: session.user.id,
              role: {
                in: ['admin', 'owner']
              }
            }
          }
        }
      }
    });

    if (!project) {
      return new NextResponse("Project not found or insufficient permissions", { status: 404 });
    }

    // Check if there are any invoices linked to this project
    const invoiceCount = await prisma.invoice.count({
      where: { projectId }
    });

    if (invoiceCount > 0) {
      return new NextResponse("Cannot delete project with existing invoices", { status: 400 });
    }

    await prisma.project.delete({
      where: { id: projectId }
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}