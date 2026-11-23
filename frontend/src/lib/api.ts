/**
 * API client sederhana untuk komunikasi frontend -> backend (Laravel REST API).
 * Mendukung Sanctum cookie-based SPA authentication dengan credentials: include.
 */

export interface HealthResponse {
  status: 'ok' | 'error' | 'degraded';
  app_name: string;
  server_time: string;
  database: 'ok' | 'gagal';
}

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(
    message: string,
    status?: number,
    data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_HEADERS: HeadersInit = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

/**
 * Wrapper fetch dengan mode credentials include untuk Sanctum SPA
 */
export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      payload?.message ||
      (response.status === 503
        ? 'Layanan backend atau database sedang tidak dapat dijangkau.'
        : `Terjadi kesalahan pada server (Status: ${response.status})`);

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

/**
 * Pengecekan status kesehatan sistem (API & Database)
 */
export async function getSystemHealth(): Promise<HealthResponse> {
  try {
    return await apiClient<HealthResponse>('/api/health');
  } catch (err: unknown) {
    if (err instanceof ApiError && err.data) {
      const data = err.data as Partial<HealthResponse>;
      if (data.database) {
        return data as HealthResponse;
      }
    }
    throw err;
  }
}
