import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const designPartnerSchema = z.object({
  fullName: z.string().min(2, "Le nom est requis."),
  workEmail: z.string().email("Un email valide est requis."),
  companyName: z.string().min(2, "Le nom de société est requis."),
  companySize: z.enum(["1-4", "5-10", "11-25", "26-50", "50+"]),
  billingModel: z.enum(["retainer", "milestone", "timesheet", "mixed"]),
  notes: z.string().max(2000, "Le message est trop long.").optional().or(z.literal("")),
});

const resend = new Resend(process.env.RESEND_API_KEY || "fake-api-key-for-build");
const emailFrom = process.env.EMAIL_FROM;

function billingModelLabel(value: z.infer<typeof designPartnerSchema>["billingModel"]) {
  switch (value) {
    case "retainer":
      return "Retainers mensuels";
    case "milestone":
      return "Facturation au jalon";
    case "timesheet":
      return "Temps passé / timesheets";
    case "mixed":
      return "Mixte";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = designPartnerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    const submission = validation.data;

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "fake-api-key-for-build" || !emailFrom) {
      console.log("Skipping design partner email send (email env not configured):", submission);
    } else {
      await resend.emails.send({
        from: emailFrom,
        to: [emailFrom],
        subject: `Nouvelle demande démo Splitfact - ${submission.companyName}`,
        replyTo: submission.workEmail,
        html: `
          <h2>Nouvelle demande de démo / programme pilote</h2>
          <p><strong>Nom :</strong> ${submission.fullName}</p>
          <p><strong>Email :</strong> ${submission.workEmail}</p>
          <p><strong>Société :</strong> ${submission.companyName}</p>
          <p><strong>Taille :</strong> ${submission.companySize}</p>
          <p><strong>Workflow de billing :</strong> ${billingModelLabel(submission.billingModel)}</p>
          <p><strong>Notes :</strong><br/>${(submission.notes || "Aucune note").replace(/\n/g, "<br/>")}</p>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Design partner request failed:", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer votre demande pour le moment." },
      { status: 500 }
    );
  }
}
