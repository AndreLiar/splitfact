export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly info?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let info: unknown;
    try { info = await res.json(); } catch { /* empty */ }
    const msg = (info as { error?: string })?.error ?? res.statusText;
    throw new ApiError(res.status, msg, info);
  }
  return res.json() as Promise<T>;
}
