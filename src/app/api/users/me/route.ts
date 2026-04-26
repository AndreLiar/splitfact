import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendAccountDeletionConfirmation } from "@/lib/email-service";


const companyLegalStatuses = ["SASU", "EURL", "SARL", "SAS"];

const userProfileSchema = z.object({
  name: z.string().min(1, "Name / Company Name is required."),
  fiscalRegime: z.enum(["MicroBIC", "BNC", "SASU", "EI", "Other"], { required_error: "Régime fiscal requis." }),
  microEntrepreneurType: z.enum(["COMMERCANT", "PRESTATAIRE", "LIBERAL"]).optional(), // New field
  declarationFrequency: z.enum(["monthly", "quarterly"]).optional(), // New field for URSSAF declarations
  siret: z.string().length(14, "SIRET must be 14 digits.").regex(/^\d+$/, "SIRET must contain only digits."),
  address: z.string().min(1, "Address is required."),
  legalStatus: z.string().min(1, "Legal Status is required."),
  rcsNumber: z.string().optional(),
  shareCapital: z.string().optional(),
  apeCode: z.string().length(5, "APE Code must be 5 characters.").regex(/^\d{4}[A-Z]$/, "APE Code must be 4 digits followed by 1 uppercase letter."),
  tvaNumber: z.string().optional(),
}).superRefine((data, ctx) => {
  // Conditional validation for microEntrepreneurType
  if (data.fiscalRegime === "MicroBIC" || data.fiscalRegime === "BNC") {
    if (!data.microEntrepreneurType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Micro-Entrepreneur Type is required for Micro-BIC/BNC regimes.",
        path: ["microEntrepreneurType"],
      });
    }
    // Declaration frequency is required for micro-entrepreneurs
    if (!data.declarationFrequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Declaration Frequency is required for Micro-BIC/BNC regimes.",
        path: ["declarationFrequency"],
      });
    }
  }
  // TVA Number validation for micro-entrepreneurs (optional)
  if (data.tvaNumber && (!data.tvaNumber.startsWith("FR") || data.tvaNumber.length !== 13 || !/^FR\d{11}$/.test(data.tvaNumber))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "TVA Number must be in 'FR12345678901' format if provided.",
      path: ["tvaNumber"],
    });
  }

  // Conditional validation for rcsNumber and shareCapital
  if (companyLegalStatuses.includes(data.legalStatus)) {
    if (!data.rcsNumber || data.rcsNumber.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "RCS Number is required for this legal status.",
        path: ["rcsNumber"],
      });
    }
    if (!data.shareCapital || data.shareCapital.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Share Capital is required for this legal status.",
        path: ["shareCapital"],
      });
    }
  }
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, fiscalRegime: true, microEntrepreneurType: true, declarationFrequency: true, siret: true, tvaNumber: true, address: true, legalStatus: true, rcsNumber: true, shareCapital: true, apeCode: true, stripeAccountId: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const validation = userProfileSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
  }

  const { name, fiscalRegime, microEntrepreneurType, declarationFrequency, siret, tvaNumber, address, legalStatus, rcsNumber, shareCapital, apeCode } = validation.data;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name,
        fiscalRegime: fiscalRegime,
        microEntrepreneurType: microEntrepreneurType || null,
        declarationFrequency: declarationFrequency || null,
        siret: siret,
        tvaNumber: tvaNumber || null,
        address: address,
        legalStatus: legalStatus,
        rcsNumber: rcsNumber || null,
        shareCapital: shareCapital || null,
        apeCode: apeCode,
      },
      select: { id: true, name: true, email: true, fiscalRegime: true, microEntrepreneurType: true, declarationFrequency: true, siret: true, tvaNumber: true, address: true, legalStatus: true, rcsNumber: true, shareCapital: true, apeCode: true, stripeAccountId: true },
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE /api/users/me — GDPR right-to-erasure (requires password confirmation)
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { password } = await request.json().catch(() => ({}));
  if (!password) {
    return NextResponse.json({ error: 'Mot de passe requis pour confirmer la suppression.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, password: true } });
  if (!user) return new NextResponse("Not found", { status: 404 });

  if (user.password) {
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 403 });
  }

  // Delete in dependency order (no cascade on most relations)
  await prisma.$transaction([
    prisma.notificationQueue.deleteMany({ where: { userId: user.id } }),
    prisma.notification.deleteMany({ where: { userId: user.id } }),
    prisma.billingTrigger.deleteMany({ where: { userId: user.id } }),
    prisma.eReportingPeriod.deleteMany({ where: { userId: user.id } }),
    prisma.complianceEvent.deleteMany({ where: { userId: user.id } }),
    prisma.urssafReport.deleteMany({ where: { userId: user.id } }),
    prisma.receivedInvoice.deleteMany({ where: { userId: user.id } }),
  ]);

  // Delete invoice children before invoices
  const invoiceIds = (await prisma.invoice.findMany({ where: { userId: user.id }, select: { id: true } })).map(i => i.id);
  if (invoiceIds.length > 0) {
    await prisma.$transaction([
      prisma.activityLog.deleteMany({ where: { invoiceId: { in: invoiceIds } } }),
      prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } }),
      prisma.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } }),
    ]);
  }

  await prisma.$transaction([
    prisma.invoice.deleteMany({ where: { userId: user.id } }),
    prisma.client.deleteMany({ where: { userId: user.id } }),
    prisma.verificationToken.deleteMany({ where: { identifier: user.email ?? '' } }),
    // Account and Session have onDelete: Cascade — they'll be removed with the User
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  if (user.email) await sendAccountDeletionConfirmation(user.email);

  return NextResponse.json({ message: 'Compte supprimé.' });
}
