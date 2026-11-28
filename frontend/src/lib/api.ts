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
    // Tangani 401 secara global: arahkan kembali ke login HANYA jika sedang di area admin (/admin/*)
    if (response.status === 401 && typeof window !== 'undefined') {
        if (window.location.pathname.startsWith('/admin')) {
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

  /* ============================================================================
   * Modul Agenda & Dokumentasi Galeri
   * ============================================================================ */

  export interface EventData {
    id: number;
    title: string;
    slug: string;
    summary: string;
    description: string;
    category: string;
    starts_at: string;
    ends_at: string | null;
    location: string | null;
    cover_path?: string | null;
    cover_url: string | null;
    status: 'draft' | 'published';
    created_at: string;
    creator?: { id: number; name: string; username: string };
    updater?: { id: number; name: string; username: string };
    albums?: AlbumData[];
  }

  export interface AlbumPhotoData {
    id: number;
    album_id: number;
    path?: string;
    photo_url: string;
    caption: string | null;
    sort_order: number;
  }

  export interface AlbumData {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    event_id: number | null;
    taken_at: string | null;
    cover_photo_id?: number | null;
    cover_url: string | null;
    status: 'draft' | 'published';
    created_at: string;
    photos_count: number;
    event?: { id: number; title: string; slug: string } | null;
    creator?: { id: number; name: string; username: string };
    photos?: AlbumPhotoData[];
  }

  export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
  }

  export interface EventPayload {
    title: string;
    summary: string;
    description: string;
    category: string;
    starts_at: string;
    ends_at?: string | null;
    location?: string | null;
    status?: 'draft' | 'published';
  }

  export interface AlbumPayload {
    title: string;
    description?: string | null;
    event_id?: number | null;
    taken_at?: string | null;
    status?: 'draft' | 'published';
  }

  // --- Publik API ---

  export async function getPublicEvents(params: { scope?: 'upcoming' | 'past'; category?: string; page?: number } = {}): Promise<PaginatedResponse<EventData>> {
    const query = new URLSearchParams();
    if (params.scope) query.append('scope', params.scope);
    if (params.category) query.append('category', params.category);
    if (params.page) query.append('page', params.page.toString());
    return await apiClient<PaginatedResponse<EventData>>(`/api/public/events?${query.toString()}`);
  }

  export async function getPublicEventDetail(slug: string): Promise<{ data: EventData }> {
    return await apiClient<{ data: EventData }>(`/api/public/events/${slug}`);
  }

  export async function getPublicAlbums(page = 1): Promise<PaginatedResponse<AlbumData>> {
    return await apiClient<PaginatedResponse<AlbumData>>(`/api/public/albums?page=${page}`);
  }

  export async function getPublicAlbumDetail(slug: string): Promise<{ data: AlbumData }> {
    return await apiClient<{ data: AlbumData }>(`/api/public/albums/${slug}`);
  }

  // --- Admin API: Events ---

  export async function getAdminEvents(params: { status?: string; search?: string; category?: string; page?: number } = {}): Promise<PaginatedResponse<EventData>> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.page) query.append('page', params.page.toString());
    return await apiClient<PaginatedResponse<EventData>>(`/api/admin/events?${query.toString()}`);
  }

  export async function createAdminEvent(payload: EventPayload): Promise<{ data: EventData; message: string }> {
    return await apiClient<{ data: EventData; message: string }>('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  export async function getAdminEventDetail(id: number): Promise<{ data: EventData }> {
    return await apiClient<{ data: EventData }>(`/api/admin/events/${id}`);
  }

  export async function updateAdminEvent(id: number, payload: Partial<EventPayload>): Promise<{ data: EventData; message: string }> {
    return await apiClient<{ data: EventData; message: string }>(`/api/admin/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  export async function deleteAdminEvent(id: number): Promise<{ message: string }> {
    return await apiClient<{ message: string }>(`/api/admin/events/${id}`, {
      method: 'DELETE',
    });
  }

  export async function uploadEventCover(id: number, file: File): Promise<{ data: EventData; message: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return await apiClient<{ data: EventData; message: string }>(`/api/admin/events/${id}/cover`, {
      method: 'POST',
      body: formData,
    });
  }

  export async function deleteEventCover(id: number): Promise<{ data: EventData; message: string }> {
    return await apiClient<{ data: EventData; message: string }>(`/api/admin/events/${id}/cover`, {
      method: 'DELETE',
    });
  }

  export async function publishAdminEvent(id: number): Promise<{ data: EventData; message: string }> {
    return await apiClient<{ data: EventData; message: string }>(`/api/admin/events/${id}/publish`, {
      method: 'POST',
    });
  }

  export async function unpublishAdminEvent(id: number): Promise<{ data: EventData; message: string }> {
    return await apiClient<{ data: EventData; message: string }>(`/api/admin/events/${id}/unpublish`, {
      method: 'POST',
    });
  }

  // --- Admin API: Albums ---

  export async function getAdminAlbums(params: { status?: string; search?: string; page?: number } = {}): Promise<PaginatedResponse<AlbumData>> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    return await apiClient<PaginatedResponse<AlbumData>>(`/api/admin/albums?${query.toString()}`);
  }

  export async function createAdminAlbum(payload: AlbumPayload): Promise<{ data: AlbumData; message: string }> {
    return await apiClient<{ data: AlbumData; message: string }>('/api/admin/albums', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  export async function getAdminAlbumDetail(id: number): Promise<{ data: AlbumData }> {
    return await apiClient<{ data: AlbumData }>(`/api/admin/albums/${id}`);
  }

  export async function updateAdminAlbum(id: number, payload: Partial<AlbumPayload>): Promise<{ data: AlbumData; message: string }> {
    return await apiClient<{ data: AlbumData; message: string }>(`/api/admin/albums/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  export async function deleteAdminAlbum(id: number): Promise<{ message: string }> {
    return await apiClient<{ message: string }>(`/api/admin/albums/${id}`, {
      method: 'DELETE',
    });
  }

  export async function publishAdminAlbum(id: number): Promise<{ data: AlbumData; message: string }> {
    return await apiClient<{ data: AlbumData; message: string }>(`/api/admin/albums/${id}/publish`, {
      method: 'POST',
    });
  }

  export async function unpublishAdminAlbum(id: number): Promise<{ data: AlbumData; message: string }> {
    return await apiClient<{ data: AlbumData; message: string }>(`/api/admin/albums/${id}/unpublish`, {
      method: 'POST',
    });
  }

  export async function uploadAlbumPhotos(
    albumId: number,
    files: File[],
    captions: string[] = []
  ): Promise<{ message: string; uploaded: AlbumPhotoData[]; failed: { file: string; error: string }[]; album: AlbumData }> {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos[]', file));
    captions.forEach((cap) => formData.append('captions[]', cap));
    return await apiClient<{ message: string; uploaded: AlbumPhotoData[]; failed: { file: string; error: string }[]; album: AlbumData }>(
      `/api/admin/albums/${albumId}/photos`,
      {
        method: 'POST',
        body: formData,
      }
    );
  }

  export async function updatePhotoCaption(albumId: number, photoId: number, caption: string): Promise<{ message: string; data: AlbumPhotoData }> {
    return await apiClient<{ message: string; data: AlbumPhotoData }>(`/api/admin/albums/${albumId}/photos/${photoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ caption }),
    });
  }

  export async function deleteAlbumPhoto(albumId: number, photoId: number): Promise<{ message: string; album: AlbumData }> {
    return await apiClient<{ message: string; album: AlbumData }>(`/api/admin/albums/${albumId}/photos/${photoId}`, {
      method: 'DELETE',
    });
  }

  export async function reorderAlbumPhotos(albumId: number, ids: number[]): Promise<{ message: string; photos: AlbumPhotoData[] }> {
    return await apiClient<{ message: string; photos: AlbumPhotoData[] }>(`/api/admin/albums/${albumId}/photos/reorder`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  export async function setAlbumCoverPhoto(albumId: number, photoId: number): Promise<{ message: string; data: AlbumData }> {
    return await apiClient<{ message: string; data: AlbumData }>(`/api/admin/albums/${albumId}/photos/set-cover`, {
      method: 'POST',
      body: JSON.stringify({ photo_id: photoId }),
    });
  }

  /* -------------------------------------------------------------------------- */
  /* Modul Aspirasi & Saran Warga                                               */
  /* -------------------------------------------------------------------------- */

  export type AspirationCategory = 'saran' | 'keluhan' | 'pertanyaan' | 'usulan_kegiatan' | 'lainnya';
  export type AspirationStatus = 'new' | 'read' | 'in_progress' | 'done' | 'rejected' | 'spam';

  export interface AspirationData {
    id: number;
    tracking_code: string;
    name?: string | null;
    contact?: string | null;
    category: AspirationCategory;
    subject: string;
    message: string;
    status: AspirationStatus;
    internal_note?: string | null;
    public_reply?: string | null;
    is_public: boolean;
    handled_by?: number | null;
    handler?: {
      id: number;
      name: string;
      username: string;
    } | null;
    created_at: string;
    updated_at: string;
  }

  export interface PublicAspirationData {
    id: number;
    author_name: string;
    category: AspirationCategory;
    subject: string;
    message: string;
    public_reply?: string | null;
    created_at: string;
  }

  export interface AspirationTrackingData {
    tracking_code: string;
    status: AspirationStatus;
    category: AspirationCategory;
    subject: string;
    public_reply?: string | null;
    created_at: string;
  }

  export interface AspirationStats {
    new: number;
    read: number;
    in_progress: number;
    done: number;
    rejected: number;
    spam: number;
    total: number;
  }

  export interface SubmitAspirationPayload {
    name?: string | null;
    contact?: string | null;
    category: string;
    subject: string;
    message: string;
    website?: string;
  }

  export async function submitAspiration(payload: SubmitAspirationPayload): Promise<{ message: string; tracking_code: string }> {
    return await apiClient<{ message: string; tracking_code: string }>('/api/public/aspirations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  export async function trackAspiration(code: string): Promise<AspirationTrackingData> {
    return await apiClient<AspirationTrackingData>(`/api/public/aspirations/track/${encodeURIComponent(code)}`);
  }

  export async function getPublicAspirations(page = 1): Promise<PaginatedResponse<PublicAspirationData>> {
    return await apiClient<PaginatedResponse<PublicAspirationData>>(`/api/public/aspirations?page=${page}`);
  }

  export async function getAdminAspirations(params?: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<AspirationData>> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));

    const qs = query.toString();
    return await apiClient<PaginatedResponse<AspirationData>>(`/api/admin/aspirations${qs ? `?${qs}` : ''}`);
  }

  export async function getAdminAspirationStats(): Promise<AspirationStats> {
    return await apiClient<AspirationStats>('/api/admin/aspirations/stats');
  }

  export async function getAdminAspiration(id: number): Promise<AspirationData> {
    return await apiClient<AspirationData>(`/api/admin/aspirations/${id}`);
  }

  export async function updateAdminAspiration(
    id: number,
    data: {
      status?: string;
      internal_note?: string | null;
      public_reply?: string | null;
      is_public?: boolean;
    },
  ): Promise<AspirationData> {
    return await apiClient<AspirationData>(`/api/admin/aspirations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  export async function deleteAdminAspiration(id: number): Promise<{ message: string }> {
    return await apiClient<{ message: string }>(`/api/admin/aspirations/${id}`, {
      method: 'DELETE',
    });
  }

  /* -------------------------------------------------------------------------- */
  /* Modul Transparansi & Pengelolaan Keuangan                                  */
  /* -------------------------------------------------------------------------- */

  export type FinanceType = 'income' | 'expense';
  export type FinanceStatus = 'draft' | 'published';

  export interface FinanceCategoryData {
    id: number;
    name: string;
    type: FinanceType;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
  }

  export interface FinanceSettingData {
    id: number;
    opening_balance: number;
    opening_date: string;
    updated_by?: number | null;
    updater?: {
      id: number;
      name: string;
      username: string;
    } | null;
    updated_at?: string;
  }

  export interface FinanceTransactionData {
    id: number;
    type: FinanceType;
    category_id: number;
    amount: number;
    transaction_date: string;
    description: string;
    counterparty?: string | null;
    counterparty_public: boolean;
    proof_path?: string | null;
    status: FinanceStatus;
    corrects_id?: number | null;
    correction_reason?: string | null;
    created_by?: number | null;
    updated_by?: number | null;
    published_at?: string | null;
    created_at: string;
    updated_at: string;
    category?: FinanceCategoryData;
    creator?: { id: number; name: string; username: string };
    updater?: { id: number; name: string; username: string };
    original_transaction?: {
      id: number;
      transaction_date: string;
      type: FinanceType;
      amount: number;
      description: string;
    };
    corrections?: Array<{
      id: number;
      transaction_date: string;
      type: FinanceType;
      amount: number;
      description: string;
      correction_reason?: string | null;
    }>;
  }

  export interface PublicFinanceTransactionData {
    id: number;
    transaction_date: string;
    type: FinanceType;
    category: string;
    category_id: number;
    amount: number;
    description: string;
    counterparty_label?: string | null;
    is_correction: boolean;
    corrects_id?: number | null;
    correction_reason?: string | null;
  }

  export interface FinanceSummaryData {
    opening_balance: number;
    opening_date: string;
    total_income: number;
    total_expense: number;
    balance: number;
    last_published_at: string | null;
    year: number;
    total_income_year: number;
    total_expense_year: number;
    net_year: number;
    monthly: Array<{
      month: number;
      income: number;
      expense: number;
      net: number;
    }>;
    by_category: {
      income: Array<{ category_id: number; name: string; total: number }>;
      expense: Array<{ category_id: number; name: string; total: number }>;
    };
  }

  export interface StoreTransactionPayload {
    type: FinanceType;
    category_id: number;
    amount: number;
    transaction_date: string;
    description: string;
    counterparty?: string | null;
    counterparty_public?: boolean;
    status?: FinanceStatus;
  }

  export interface CorrectTransactionPayload {
    correction_reason: string;
    replacement?: {
      type: FinanceType;
      category_id: number;
      amount: number;
      transaction_date: string;
      description: string;
      counterparty?: string | null;
      counterparty_public?: boolean;
    };
  }

  // 1. Publik Keuangan
  export async function getPublicFinanceSummary(year?: number): Promise<FinanceSummaryData> {
    const q = year ? `?year=${year}` : '';
    return await apiClient<FinanceSummaryData>(`/api/public/finance/summary${q}`);
  }

  export async function getPublicFinanceTransactions(params?: {
    month?: string;
    type?: string;
    category_id?: number;
    page?: number;
  }): Promise<PaginatedResponse<PublicFinanceTransactionData>> {
    const query = new URLSearchParams();
    if (params?.month) query.set('month', params.month);
    if (params?.type) query.set('type', params.type);
    if (params?.category_id) query.set('category_id', String(params.category_id));
    if (params?.page) query.set('page', String(params.page));

    const qs = query.toString();
    return await apiClient<PaginatedResponse<PublicFinanceTransactionData>>(
      `/api/public/finance/transactions${qs ? `?${qs}` : ''}`,
    );
  }

  export async function getPublicFinanceCategories(): Promise<FinanceCategoryData[]> {
    return await apiClient<FinanceCategoryData[]>('/api/public/finance/categories');
  }

  // 2. Admin Keuangan - Kategori & Pengaturan
  export async function getAdminFinanceCategories(type?: string): Promise<FinanceCategoryData[]> {
    const q = type ? `?type=${type}` : '';
    return await apiClient<FinanceCategoryData[]>(`/api/admin/finance/categories${q}`);
  }

  export async function createAdminFinanceCategory(data: {
    name: string;
    type: FinanceType;
    is_active?: boolean;
  }): Promise<FinanceCategoryData> {
    return await apiClient<FinanceCategoryData>('/api/admin/finance/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  export async function updateAdminFinanceCategory(
    id: number,
    data: {
      name?: string;
      is_active?: boolean;
    },
  ): Promise<FinanceCategoryData> {
    return await apiClient<FinanceCategoryData>(`/api/admin/finance/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  export async function deleteAdminFinanceCategory(id: number): Promise<{ message: string }> {
    return await apiClient<{ message: string }>(`/api/admin/finance/categories/${id}`, {
      method: 'DELETE',
    });
  }

  export async function getAdminFinanceSettings(): Promise<FinanceSettingData> {
    return await apiClient<FinanceSettingData>('/api/admin/finance/settings');
  }

  export async function updateAdminFinanceSettings(data: {
    opening_balance: number;
    opening_date: string;
  }): Promise<FinanceSettingData> {
    return await apiClient<FinanceSettingData>('/api/admin/finance/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 3. Admin Keuangan - Transaksi & Bukti
  export async function getAdminFinanceTransactions(params?: {
    month?: string;
    type?: string;
    category_id?: number;
    status?: string;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<FinanceTransactionData>> {
    const query = new URLSearchParams();
    if (params?.month) query.set('month', params.month);
    if (params?.type) query.set('type', params.type);
    if (params?.category_id) query.set('category_id', String(params.category_id));
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));

    const qs = query.toString();
    return await apiClient<PaginatedResponse<FinanceTransactionData>>(
      `/api/admin/finance/transactions${qs ? `?${qs}` : ''}`,
    );
  }

  export async function getAdminFinanceTransaction(id: number): Promise<FinanceTransactionData> {
    return await apiClient<FinanceTransactionData>(`/api/admin/finance/transactions/${id}`);
  }

  export async function createAdminFinanceTransaction(
    payload: StoreTransactionPayload,
  ): Promise<FinanceTransactionData> {
    return await apiClient<FinanceTransactionData>('/api/admin/finance/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  export async function updateAdminFinanceTransaction(
    id: number,
    payload: Partial<StoreTransactionPayload>,
  ): Promise<FinanceTransactionData> {
    return await apiClient<FinanceTransactionData>(`/api/admin/finance/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  export async function deleteAdminFinanceTransaction(id: number): Promise<{ message: string }> {
    return await apiClient<{ message: string }>(`/api/admin/finance/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  export async function publishAdminFinanceTransaction(id: number): Promise<FinanceTransactionData> {
    return await apiClient<FinanceTransactionData>(`/api/admin/finance/transactions/${id}/publish`, {
      method: 'POST',
    });
  }

  export async function unpublishAdminFinanceTransaction(id: number): Promise<FinanceTransactionData> {
    return await apiClient<FinanceTransactionData>(`/api/admin/finance/transactions/${id}/unpublish`, {
      method: 'POST',
    });
  }

  export async function correctAdminFinanceTransaction(
    id: number,
    payload: CorrectTransactionPayload,
  ): Promise<{
    message: string;
    reversing_transaction: FinanceTransactionData;
    replacement_transaction?: FinanceTransactionData;
  }> {
    return await apiClient<{
      message: string;
      reversing_transaction: FinanceTransactionData;
      replacement_transaction?: FinanceTransactionData;
    }>(`/api/admin/finance/transactions/${id}/correct`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  export async function uploadAdminFinanceProof(
    id: number,
    file: File,
  ): Promise<{ message: string; proof_path: string }> {
    const formData = new FormData();
    formData.append('proof', file);

    return await apiClient<{ message: string; proof_path: string }>(
      `/api/admin/finance/transactions/${id}/proof`,
      {
        method: 'POST',
        body: formData,
      },
    );
  }

  export async function deleteAdminFinanceProof(id: number): Promise<{ message: string }> {
    return await apiClient<{ message: string }>(`/api/admin/finance/transactions/${id}/proof`, {
      method: 'DELETE',
    });
  }

  export function getAdminFinanceProofUrl(id: number): string {
    return `/api/admin/finance/transactions/${id}/proof`;
  }

  /* ============================================================================
   * Dashboard Admin
   * ============================================================================ */

  export interface AdminDashboardData {
    attention: {
      aspirations_new: number;
      events_draft: number;
      albums_draft: number;
      finance_draft: number;
    };
    upcoming_events: Array<{
      id: number;
      title: string;
      starts_at: string;
      status: 'draft' | 'published';
    }>;
    finance: {
      balance: number;
      income_month: number;
      expense_month: number;
      last_published_at: string | null;
    };
    recent_activity: Array<{
      action: string;
      label_id: string;
      actor_name: string;
      created_at: string | null;
    }>;
  }

  export async function getAdminDashboard(): Promise<AdminDashboardData> {
    return await apiClient<AdminDashboardData>('/api/admin/dashboard');
  }




