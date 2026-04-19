import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM ?? 'InvoiceOps <noreply@invoiceops.fr>';

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
  const { to, clientName, issuerName, invoiceNumber, totalAmount, dueDate, daysOverdue } = params;

  const urgency = daysOverdue && daysOverdue > 0
    ? `<p style="color:#dc2626;font-weight:600">Cette facture est en retard de ${daysOverdue} jour(s).</p>`
    : `<p style="color:#d97706">Cette facture arrive à échéance le <strong>${formatDate(dueDate)}</strong>.</p>`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <h2 style="color:#d97706">Rappel de paiement — ${invoiceNumber}</h2>
      <p>Bonjour ${clientName},</p>
      <p>Nous vous rappelons que la facture <strong>${invoiceNumber}</strong> de <strong>${issuerName}</strong> est en attente de règlement.</p>
      ${urgency}
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr style="background:#f3f4f6">
          <td style="padding:10px 14px">Montant dû</td>
          <td style="padding:10px 14px;font-weight:600;text-align:right">${formatAmount(totalAmount)}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px">Date d'échéance</td>
          <td style="padding:10px 14px;text-align:right">${formatDate(dueDate)}</td>
        </tr>
      </table>
      <p>Si vous avez déjà effectué le règlement, veuillez ignorer ce message.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#6b7280;font-size:12px">${issuerName}</p>
    </div>
  `;

  if (!resend) { console.warn('RESEND_API_KEY not set — reminder email skipped'); return; }
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Rappel — Facture ${invoiceNumber} de ${formatAmount(totalAmount)} en attente`,
    html,
  });
}
