import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM ?? 'InvoiceOps <noreply@invoiceops.fr>';
const APP_URL = process.env.NEXTAUTH_URL ?? 'https://invoiceops.fr';

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <h2 style="color:#2563eb">Vérifiez votre adresse email</h2>
      <p>Merci pour votre inscription sur InvoiceOps. Cliquez sur le bouton ci-dessous pour activer votre compte.</p>
      <p style="margin:24px 0">
        <a href="${url}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
          Vérifier mon email
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px">Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#6b7280;font-size:12px">InvoiceOps — Facturation électronique conforme EN 16931</p>
    </div>
  `;
  if (!resend) { console.warn('RESEND_API_KEY not set — verification email skipped'); return; }
  return resend.emails.send({ from: FROM, to: email, subject: 'Vérifiez votre adresse email — InvoiceOps', html });
}

export async function sendAccountDeletionConfirmation(email: string) {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <h2 style="color:#dc2626">Votre compte a été supprimé</h2>
      <p>Votre compte InvoiceOps et toutes vos données associées ont été définitivement supprimés conformément au RGPD (art. 17).</p>
      <p style="color:#6b7280;font-size:13px">Si vous n'êtes pas à l'origine de cette demande, contactez-nous immédiatement à support@invoiceops.fr.</p>
    </div>
  `;
  if (!resend) return;
  return resend.emails.send({ from: FROM, to: email, subject: 'Votre compte InvoiceOps a été supprimé', html });
}

export interface SendInvoiceEmailParams {
  to: string;
  clientName: string;
  issuerName: string;
  invoiceNumber: string;
  invoiceId: string;
  totalAmount: number;
  dueDate: Date | string;
  facturxPdfUrl?: string | null;
  pdfUrl?: string | null;
}

export interface SendReminderEmailParams {
  to: string;
  clientName: string;
  issuerName: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: Date | string;
  daysOverdue?: number;
  reminderCount?: number;  // 0-based: determines tone escalation
  isMiseEnDemeure?: boolean;
}

function formatAmount(amount: number) {
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('fr-FR');
}

export async function sendInvoiceEmail(params: SendInvoiceEmailParams) {
  const { to, clientName, issuerName, invoiceNumber, invoiceId, totalAmount, dueDate, facturxPdfUrl, pdfUrl } = params;

  const downloadLink = facturxPdfUrl ?? pdfUrl;
  const appUrl = process.env.NEXTAUTH_URL ?? '';
  const paymentUrl = `${appUrl}/invoices/${invoiceId}/pay`;

  const downloadSection = downloadLink
    ? `<p style="margin:24px 0 8px"><a href="${downloadLink}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Télécharger la facture</a></p>`
    : '';
  const paySection = `<p style="margin:8px 0 24px"><a href="${paymentUrl}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Payer en ligne</a></p>`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <h2 style="color:#2563eb">Facture ${invoiceNumber}</h2>
      <p>Bonjour ${clientName},</p>
      <p>Veuillez trouver ci-joint la facture <strong>${invoiceNumber}</strong> de <strong>${issuerName}</strong>.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr style="background:#f3f4f6">
          <td style="padding:10px 14px">Montant TTC</td>
          <td style="padding:10px 14px;font-weight:600;text-align:right">${formatAmount(totalAmount)}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px">Date d'échéance</td>
          <td style="padding:10px 14px;text-align:right">${formatDate(dueDate)}</td>
        </tr>
      </table>
      ${downloadSection}
      ${paySection}
      <p style="color:#6b7280;font-size:13px">Cette facture est au format Factur-X, conforme à la réglementation française de facturation électronique (EN 16931).</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#6b7280;font-size:12px">${issuerName}</p>
    </div>
  `;

  if (!resend) { console.warn('RESEND_API_KEY not set — invoice email skipped'); return; }
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Facture ${invoiceNumber} — ${formatAmount(totalAmount)} à régler avant le ${formatDate(dueDate)}`,
    html,
  });
}

export async function sendReminderEmail(params: SendReminderEmailParams) {
  const { to, clientName, issuerName, invoiceNumber, totalAmount, dueDate, daysOverdue, reminderCount = 0, isMiseEnDemeure = false } = params;

  // Escalating tone by step in the reminder ladder
  let headerColor: string;
  let greeting: string;
  let bodyText: string;

  if (isMiseEnDemeure) {
    headerColor = '#7f1d1d';
    greeting = `Madame, Monsieur,`;
    bodyText = `Par la présente, nous vous mettons en demeure de procéder au règlement de la facture <strong>${invoiceNumber}</strong> établie par <strong>${issuerName}</strong>, dont le montant reste impayé à ce jour.
      À défaut de règlement dans les 8 jours suivant la réception de ce courrier, nous nous réserverons le droit d'engager toute procédure de recouvrement, notamment devant le Tribunal de Commerce compétent, ainsi que de réclamer les intérêts de retard au taux légal majoré conformément à l'article L.441-10 du Code de commerce.`;
  } else if (reminderCount >= 2) {
    headerColor = '#dc2626';
    greeting = `Bonjour ${clientName},`;
    bodyText = `Nous constatons que la facture <strong>${invoiceNumber}</strong> de <strong>${issuerName}</strong>, arrivée à échéance le <strong>${formatDate(dueDate)}</strong>, reste à ce jour impayée. Nous vous demandons de bien vouloir régulariser votre situation dans les meilleurs délais afin d'éviter des frais supplémentaires.`;
  } else if (reminderCount === 1) {
    headerColor = '#d97706';
    greeting = `Bonjour ${clientName},`;
    bodyText = `Sauf erreur de notre part, la facture <strong>${invoiceNumber}</strong> de <strong>${issuerName}</strong> n'a toujours pas été réglée. Pourriez-vous nous confirmer la date de paiement prévue ?`;
  } else {
    headerColor = '#2563eb';
    greeting = `Bonjour ${clientName},`;
    bodyText = `Nous vous rappelons que la facture <strong>${invoiceNumber}</strong> de <strong>${issuerName}</strong> arrive bientôt à échéance. N'hésitez pas à nous contacter si vous avez la moindre question.`;
  }

  const urgencyLine = daysOverdue && daysOverdue > 0
    ? `<p style="color:#dc2626;font-weight:600">Cette facture accuse un retard de ${daysOverdue} jour(s).</p>`
    : `<p style="color:#d97706">Échéance : <strong>${formatDate(dueDate)}</strong></p>`;

  const miseEnDemeureBanner = isMiseEnDemeure
    ? `<div style="background:#7f1d1d;color:#fff;padding:12px 16px;border-radius:6px;margin-bottom:20px;font-weight:700;font-size:15px;letter-spacing:0.5px">MISE EN DEMEURE</div>`
    : '';

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      ${miseEnDemeureBanner}
      <h2 style="color:${headerColor}">${isMiseEnDemeure ? `Mise en Demeure — ${invoiceNumber}` : `Rappel de paiement — ${invoiceNumber}`}</h2>
      <p>${greeting}</p>
      <p>${bodyText}</p>
      ${!isMiseEnDemeure ? urgencyLine : ''}
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr style="background:#f3f4f6">
          <td style="padding:10px 14px">Montant dû</td>
          <td style="padding:10px 14px;font-weight:600;text-align:right">${formatAmount(totalAmount)}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px">Date d'échéance initiale</td>
          <td style="padding:10px 14px;text-align:right">${formatDate(dueDate)}</td>
        </tr>
        ${daysOverdue && daysOverdue > 0 ? `<tr style="background:#fef2f2"><td style="padding:10px 14px;color:#dc2626">Retard</td><td style="padding:10px 14px;text-align:right;color:#dc2626;font-weight:600">${daysOverdue} jour(s)</td></tr>` : ''}
      </table>
      ${isMiseEnDemeure
        ? `<p style="font-size:13px;color:#6b7280">Ce courrier constitue une mise en demeure au sens de l'article 1344 du Code civil. Les intérêts de retard courent à compter de la date d'échéance de la facture.</p>`
        : `<p>Si vous avez déjà effectué le règlement, veuillez ignorer ce message.</p>`}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#6b7280;font-size:12px">${issuerName}</p>
    </div>
  `;

  const subject = isMiseEnDemeure
    ? `MISE EN DEMEURE — Facture ${invoiceNumber} — ${formatAmount(totalAmount)}`
    : reminderCount >= 2
    ? `[Urgent] Facture ${invoiceNumber} impayée — ${formatAmount(totalAmount)}`
    : `Rappel — Facture ${invoiceNumber} de ${formatAmount(totalAmount)} en attente`;

  if (!resend) { console.warn('RESEND_API_KEY not set — reminder email skipped'); return; }
  return resend.emails.send({ from: FROM, to, subject, html });
}
