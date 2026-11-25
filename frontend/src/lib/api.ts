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

  const DEFAULT_HEADERS: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

/**
 * Mengambil token CSRF dari cookie browser (XSRF-TOKEN)
 */
export function getXsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Inisialisasi CSRF cookie dari Laravel Sanctum
 */
export async function initCsrf(): Promise<void> {
  await fetch('/sanctum/csrf-cookie', {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
}

/**
 * Wrapper fetch dengan mode credentials include untuk Sanctum SPA
 */
export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const xsrfToken = getXsrfToken();

  const headers: Record<string, string> = {
    ...DEFAULT_HEADERS,
    ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
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

export interface AdminUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'superadmin' | 'admin';
  is_active: boolean;
  must_change_password: boolean;
  last_login_at?: string;
}

export interface LoginResponse {
  must_change_password: boolean;
}

/**
 * Login admin lewat Sanctum SPA
 */
export async function loginAdmin(credentials: { username: string; password: string }): Promise<LoginResponse> {
  // 1. Ambil cookie CSRF
  await initCsrf();

  // 2. Kirim kredensial login
  return await apiClient<LoginResponse>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

/**
 * Mengambil data profil admin yang sedang login
 */
export async function getAdminMe(): Promise<AdminUser> {
  return await apiClient<AdminUser>('/api/admin/me');
}

/**
 * Logout admin
 */
export async function logoutAdmin(): Promise<{ message: string }> {
  return await apiClient<{ message: string }>('/api/admin/logout', {
    method: 'POST',
  });
}

