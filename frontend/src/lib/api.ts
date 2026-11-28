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

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
    ...((options.headers as Record<string, string>) || {}),
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
    // Tangani 401 secara global: arahkan kembali ke login jika belum di halaman login
    if (response.status === 401 && typeof window !== 'undefined') {
      if (!window.location.pathname.startsWith('/loginadminkatar')) {
        window.location.href = '/loginadminkatar';
      }
    }

    const message =
      payload?.message ||
      (response.status === 403
        ? 'Anda tidak memiliki hak akses untuk tindakan ini.'
        : response.status === 503
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
  role: 'superadmin' | 'admin';
  must_change_password: boolean;
}

export interface ManagedUser {
  id: number;
  name: string;
  username: string;
  role: 'superadmin' | 'admin';
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
  is_self: boolean;
}

export interface LoginResponse {
  must_change_password: boolean;
}

export interface CreateUserPayload {
  name: string;
  username: string;
  role: 'admin' | 'superadmin';
}

export interface UpdateUserPayload {
  name?: string;
  role?: 'admin' | 'superadmin';
  is_active?: boolean;
}

export interface CreateUserResponse {
  data: ManagedUser;
  temporary_password: string;
}

export interface ResetPasswordResponse {
  data: ManagedUser;
  temporary_password: string;
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

/**
 * Mengambil daftar akun pengguna (Hanya Superadmin)
 */
export async function getUsers(): Promise<{ data: ManagedUser[] }> {
  return await apiClient<{ data: ManagedUser[] }>('/api/admin/users');
}

/**
 * Membuat akun baru (Hanya Superadmin)
 */
export async function createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
  return await apiClient<CreateUserResponse>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Memperbarui akun (Hanya Superadmin)
 */
export async function updateUser(id: number, payload: UpdateUserPayload): Promise<{ data: ManagedUser }> {
  return await apiClient<{ data: ManagedUser }>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Reset kata sandi pengguna lain (Hanya Superadmin)
 */
export async function resetUserPassword(id: number): Promise<ResetPasswordResponse> {
  return await apiClient<ResetPasswordResponse>(`/api/admin/users/${id}/reset-password`, {
    method: 'POST',
  });
}

/**
 * Menghapus akun (soft delete) (Hanya Superadmin)
 */
export async function deleteUser(id: number): Promise<{ message: string }> {
  return await apiClient<{ message: string }>(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
}

/* ============================================================================
 * Modul Profil Organisasi & Struktur Pengurus
 * ============================================================================ */

export interface OrganizationProfileData {
  id?: number;
  name: string;
  short_name: string;
  tagline: string | null;
  about: string;
  history: string | null;
  vision: string;
  missions: string[];
  values: string[];
  address: string;
  region_label: string;
  whatsapp: string;
  email: string;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  logo_url: string | null;
  updated_at?: string | null;
}

export interface OrganizationMemberData {
  id?: number;
  name: string;
  position: string;
  division: string | null;
  period: string | null;
  bio: string | null;
  photo_url: string | null;
  sort_order?: number;
  is_visible?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export type UpdateProfilePayload = Omit<OrganizationProfileData, 'id' | 'logo_url' | 'updated_at'>;

export interface MemberPayload {
  name: string;
  position: string;
  division: string | null;
  period: string | null;
  bio: string | null;
  is_visible: boolean;
}

// --- Publik ---

export async function getPublicProfile(): Promise<{ data: OrganizationProfileData | null }> {
  return await apiClient<{ data: OrganizationProfileData | null }>('/api/public/profile');
}

export async function getPublicMembers(): Promise<{ data: OrganizationMemberData[] }> {
  return await apiClient<{ data: OrganizationMemberData[] }>('/api/public/members');
}

// --- Admin ---

export async function getAdminProfile(): Promise<{ data: OrganizationProfileData }> {
  return await apiClient<{ data: OrganizationProfileData }>('/api/admin/profile');
}

export async function updateAdminProfile(
  payload: UpdateProfilePayload,
): Promise<{ data: OrganizationProfileData; message: string }> {
  return await apiClient<{ data: OrganizationProfileData; message: string }>('/api/admin/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function uploadAdminLogo(
  file: File,
): Promise<{ data: OrganizationProfileData; message: string }> {
  const formData = new FormData();
  formData.append('image', file);
  return await apiClient<{ data: OrganizationProfileData; message: string }>('/api/admin/profile/logo', {
    method: 'POST',
    body: formData,
  });
}

export async function deleteAdminLogo(): Promise<{ data: OrganizationProfileData; message: string }> {
  return await apiClient<{ data: OrganizationProfileData; message: string }>('/api/admin/profile/logo', {
    method: 'DELETE',
  });
}

export async function getAdminMembers(): Promise<{ data: OrganizationMemberData[] }> {
  return await apiClient<{ data: OrganizationMemberData[] }>('/api/admin/members');
}

export async function createAdminMember(
  payload: MemberPayload,
): Promise<{ data: OrganizationMemberData; message: string }> {
  return await apiClient<{ data: OrganizationMemberData; message: string }>('/api/admin/members', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminMember(
  id: number,
  payload: Partial<MemberPayload>,
): Promise<{ data: OrganizationMemberData; message: string }> {
  return await apiClient<{ data: OrganizationMemberData; message: string }>(`/api/admin/members/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminMember(id: number): Promise<{ message: string }> {
  return await apiClient<{ message: string }>(`/api/admin/members/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadMemberPhoto(
  id: number,
  file: File,
): Promise<{ data: OrganizationMemberData; message: string }> {
  const formData = new FormData();
  formData.append('image', file);
  return await apiClient<{ data: OrganizationMemberData; message: string }>(
    `/api/admin/members/${id}/photo`,
    {
      method: 'POST',
      body: formData,
    },
  );
}

export async function deleteMemberPhoto(
  id: number,
): Promise<{ data: OrganizationMemberData; message: string }> {
  return await apiClient<{ data: OrganizationMemberData; message: string }>(
    `/api/admin/members/${id}/photo`,
    {
      method: 'DELETE',
    },
  );
}

export async function reorderAdminMembers(
  ids: number[],
): Promise<{ data: OrganizationMemberData[]; message: string }> {
  return await apiClient<{ data: OrganizationMemberData[]; message: string }>(
    '/api/admin/members/reorder',
    {
      method: 'POST',
      body: JSON.stringify({ ids }),
    },
  );
}

