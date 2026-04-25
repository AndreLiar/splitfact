'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { UserProfile, Client } from '@/types/domain';

// ─── types ────────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoiceNumber?: string | null;
  totalAmount: number | string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  paymentStatus?: string;
  workflowStatus?: string;
  clientId?: string | null;
  clientName?: string | null;
  clientAddress?: string | null;
  client?: { id?: string | null; name?: string | null; address?: string | null; email?: string | null } | null;
  items?: Array<{ id: string; description: string; quantity: number | string; unitPrice: number | string; tvaRate?: number }>;
  issuerName?: string | null;
  issuerAddress?: string | null;
  legalMentions?: string | null;
  notes?: string | null;
  currency?: string;
  ppfStatus?: string | null;
  ppfDepositId?: string | null;
  pdfUrl?: string | null;
}

export interface Notification {
  id: string;
  type: 'INVOICE_BLOCKED' | 'COMPLIANCE_ALERT' | 'PAYMENT_REMINDER' | 'GENERAL';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: unknown;
  createdAt: string;
  readAt?: string;
}

export interface ReceivedInvoice {
  id: string;
  cppId: string;
  invoiceNumber: string;
  supplierName: string;
  supplierSiret: string | null;
  totalAmountTTC: number;
  currency: string;
  invoiceDate: string | null;
  depositedAt: string | null;
  ppfStatus: string;
  isRead: boolean;
  createdAt: string;
}

export interface ComplianceScore {
  score: number;
  level: 'green' | 'warning' | 'red';
  penaltyExposure: number;
  issuedTotal: number;
  submittedToPpf: number;
  pendingSubmission: number;
  unreportedB2C: number;
}

export interface ComplianceEvent {
  id: string;
  type: string;
  description: string;
  penaltyAmount: number;
  resolvedAt: string | null;
  createdAt: string;
  invoiceId: string | null;
}

export interface EReportingPeriod {
  id?: string;
  period: string;
  status: string;
  transactionCount: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  numeroFluxDepot?: string | null;
  submittedAt?: string | null;
  errorMessage?: string | null;
}

export interface Quota {
  plan: string;
  limit: number | null;
  used: number | null;
  remaining: number | null;
  llmConfigured?: boolean;
}

export interface Subscription {
  planId: string;
  subscriptionStatus: string;
  subscriptionPeriodEnd: string | null;
}

// ─── SWR config ───────────────────────────────────────────────────────────────

const SWR_DEFAULTS = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
} as const;

// ─── hooks ────────────────────────────────────────────────────────────────────

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR<UserProfile>(
    '/api/users/me',
    fetcher,
    SWR_DEFAULTS,
  );
  return { userProfile: data ?? null, error, isLoading, mutate };
}

export function useClients() {
  const { data, error, isLoading, mutate } = useSWR<Client[]>(
    '/api/clients',
    fetcher,
    SWR_DEFAULTS,
  );
  return { clients: data ?? [], error, isLoading, mutate };
}

export function useInvoices() {
  const { data, error, isLoading, mutate } = useSWR<{ invoices: Invoice[] }>(
    '/api/invoices',
    fetcher,
    SWR_DEFAULTS,
  );
  return { invoices: data?.invoices ?? [], error, isLoading, mutate };
}

export function useRecentInvoices(limit = 6) {
  const key = `/api/users/me/invoices?page=1&limit=${limit}`;
  const { data, error, isLoading, mutate } = useSWR<{ invoices: Invoice[] }>(
    key,
    fetcher,
    SWR_DEFAULTS,
  );
  return { invoices: data?.invoices ?? [], error, isLoading, mutate };
}

export function useAllInvoices() {
  const { data, error, isLoading, mutate } = useSWR<{ invoices: Invoice[] }>(
    '/api/users/me/invoices?all=true',
    fetcher,
    SWR_DEFAULTS,
  );
  return { invoices: data?.invoices ?? [], error, isLoading, mutate };
}

export function useInvoice(invoiceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Invoice>(
    invoiceId ? `/api/invoices/${invoiceId}` : null,
    fetcher,
    SWR_DEFAULTS,
  );
  return { invoice: data ?? null, error, isLoading, mutate };
}

export function useInvoiceActivity(invoiceId: string | null) {
  const { data, error, isLoading } = useSWR<unknown[]>(
    invoiceId ? `/api/invoices/${invoiceId}/activity` : null,
    fetcher,
    SWR_DEFAULTS,
  );
  return { activity: data ?? [], error, isLoading };
}

export function useNotifications(unread = false) {
  const key = unread
    ? '/api/notifications?unread=true&limit=100'
    : '/api/notifications?limit=100';
  const { data, error, isLoading, mutate } = useSWR<{ notifications: Notification[] }>(
    key,
    fetcher,
    SWR_DEFAULTS,
  );
  return { notifications: data?.notifications ?? [], error, isLoading, mutate };
}

export function useReceivedInvoices(unread = false) {
  const key = unread
    ? '/api/received-invoices?unread=true&limit=100'
    : '/api/received-invoices?limit=100';
  const { data, error, isLoading, mutate } = useSWR<ReceivedInvoice[]>(
    key,
    fetcher,
    SWR_DEFAULTS,
  );
  return { invoices: data ?? [], error, isLoading, mutate };
}

export function useCompliance() {
  const { data, error, isLoading, mutate } = useSWR<{ score: ComplianceScore; events: ComplianceEvent[] }>(
    '/api/compliance',
    fetcher,
    SWR_DEFAULTS,
  );
  return { score: data?.score ?? null, events: data?.events ?? [], error, isLoading, mutate };
}

export function useEReporting(period: string | null) {
  const { data, error, isLoading, mutate } = useSWR<EReportingPeriod>(
    period ? `/api/e-reporting?period=${period}` : null,
    fetcher,
    { ...SWR_DEFAULTS, shouldRetryOnError: false },
  );
  return { period: data ?? null, error, isLoading, mutate };
}

export function useEReportingPeriods(months: string[]) {
  // SWR array key — deduplicated and cached as a unit
  const key = months.length > 0 ? ['e-reporting-periods', ...months] : null;
  const { data, error, isLoading, mutate } = useSWR<EReportingPeriod[]>(
    key,
    async ([, ...periods]: string[]) => {
      const results = await Promise.all(
        periods.map(async (p) => {
          const res = await fetch(`/api/e-reporting?period=${p}`);
          if (!res.ok) return { period: p, status: 'draft', transactionCount: 0, totalHT: 0, totalTVA: 0, totalTTC: 0 } as EReportingPeriod;
          return res.json() as Promise<EReportingPeriod>;
        }),
      );
      return results;
    },
    { ...SWR_DEFAULTS, shouldRetryOnError: false },
  );
  return { periods: data ?? [], error, isLoading, mutate };
}

export function useQuota() {
  const { data, error, isLoading } = useSWR<Quota>(
    '/api/billing/quota',
    fetcher,
    SWR_DEFAULTS,
  );
  return { quota: data ?? null, error, isLoading };
}

export function useSubscription() {
  const { data, error, isLoading } = useSWR<Subscription>(
    '/api/billing/subscription',
    fetcher,
    SWR_DEFAULTS,
  );
  return { subscription: data ?? null, error, isLoading };
}

// ─── cache invalidation helpers ───────────────────────────────────────────────

export const revalidateInvoices = () => Promise.all([
  globalMutate('/api/invoices'),
  globalMutate('/api/users/me/invoices?page=1&limit=6'),
  globalMutate('/api/users/me/invoices?all=true'),
]);

export const revalidateClients = () => globalMutate('/api/clients');
export const revalidateNotifications = () => Promise.all([
  globalMutate('/api/notifications?limit=100'),
  globalMutate('/api/notifications?unread=true&limit=100'),
]);
export const revalidateReceivedInvoices = () => Promise.all([
  globalMutate('/api/received-invoices?limit=100'),
  globalMutate('/api/received-invoices?unread=true&limit=100'),
]);
