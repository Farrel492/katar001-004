<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Aspiration;
use App\Models\Event;
use App\Models\FinanceTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    private const ACTION_LABELS = [
        'admin_login' => 'Masuk ke panel admin',
        'admin_logout' => 'Keluar dari panel admin',
        'admin_password_changed' => 'Mengubah kata sandi',
        'profile_updated' => 'Memperbarui profil organisasi',
        'profile_logo_uploaded' => 'Mengunggah logo organisasi',
        'profile_logo_deleted' => 'Menghapus logo organisasi',
        'member_created' => 'Menambahkan anggota pengurus',
        'member_updated' => 'Memperbarui data pengurus',
        'member_deleted' => 'Menghapus anggota pengurus',
        'member_reordered' => 'Mengatur ulang urutan pengurus',
        'event_created' => 'Membuat agenda baru',
        'event_updated' => 'Memperbarui agenda',
        'event_deleted' => 'Menghapus agenda',
        'event_published' => 'Menerbitkan agenda',
        'event_unpublished' => 'Menarik agenda ke draf',
        'event_cover_uploaded' => 'Mengunggah sampul agenda',
        'event_cover_deleted' => 'Menghapus sampul agenda',
        'album_created' => 'Membuat album galeri baru',
        'album_updated' => 'Memperbarui album galeri',
        'album_deleted' => 'Menghapus album galeri',
        'album_published' => 'Menerbitkan album galeri',
        'album_unpublished' => 'Menarik album ke draf',
        'album_photos_uploaded' => 'Mengunggah foto ke album',
        'album_photo_deleted' => 'Menghapus foto album',
        'album_cover_set' => 'Mengatur sampul album',
        'aspiration_updated' => 'Memperbarui status/tanggapan aspirasi',
        'aspiration_deleted' => 'Menghapus aspirasi',
        'finance_setting_updated' => 'Mengatur saldo awal kas',
        'finance_category_created' => 'Menambahkan kategori keuangan',
        'finance_category_updated' => 'Memperbarui kategori keuangan',
        'finance_category_deleted' => 'Menghapus kategori keuangan',
        'finance_tx_created' => 'Mencatat transaksi kas',
        'finance_tx_updated' => 'Memperbarui transaksi kas',
        'finance_tx_deleted' => 'Menghapus transaksi kas',
        'finance_tx_published' => 'Menerbitkan transaksi kas',
        'finance_tx_unpublished' => 'Menarik transaksi ke draf',
        'finance_tx_corrected' => 'Mencatat koreksi transaksi kas',
        'finance_proof_uploaded' => 'Mengunggah bukti nota transaksi',
        'finance_proof_deleted' => 'Menghapus bukti nota transaksi',
        'user_created' => 'Membuat akun admin baru',
        'user_updated' => 'Memperbarui akun admin',
        'user_password_reset' => 'Mereset kata sandi admin',
        'user_deleted' => 'Menghapus akun admin',
    ];

    public function index(): JsonResponse
    {
        $jakartaNow = Carbon::now('Asia/Jakarta');
        $monthStart = $jakartaNow->copy()->startOfMonth()->toDateString();
        $monthEnd = $jakartaNow->copy()->endOfMonth()->toDateString();

        $attention = [
            'aspirations_new' => Aspiration::where('status', 'new')->count(),
            'events_draft' => Event::where('status', 'draft')->count(),
            'albums_draft' => Album::where('status', 'draft')->count(),
            'finance_draft' => FinanceTransaction::where('status', 'draft')->count(),
        ];

        $upcomingEvents = Event::query()
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at', 'asc')
            ->limit(3)
            ->get(['id', 'title', 'starts_at', 'status'])
            ->map(fn (Event $ev) => [
                'id' => $ev->id,
                'title' => $ev->title,
                'starts_at' => $ev->starts_at?->toIso8601String(),
                'status' => $ev->status,
            ])
            ->values();

        $incomeMonth = (int) FinanceTransaction::where('status', 'published')
            ->where('type', 'income')
            ->whereBetween('transaction_date', [$monthStart, $monthEnd])
            ->sum('amount');

        $expenseMonth = (int) FinanceTransaction::where('status', 'published')
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$monthStart, $monthEnd])
            ->sum('amount');

        $rawLastPublished = FinanceTransaction::where('status', 'published')
            ->max('published_at');

        $finance = [
            'balance' => FinanceTransaction::calculateCurrentBalance(),
            'income_month' => $incomeMonth,
            'expense_month' => $expenseMonth,
            'last_published_at' => $rawLastPublished
                ? Carbon::parse($rawLastPublished)->toIso8601String()
                : null,
        ];

        $recentActivity = DB::table('audit_logs')
            ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
            ->select('audit_logs.action', 'audit_logs.created_at', 'users.name as actor_name')
            ->orderByDesc('audit_logs.id')
            ->limit(8)
            ->get()
            ->map(function ($row) {
                $action = (string) $row->action;

                return [
                    'action' => $action,
                    'label_id' => self::ACTION_LABELS[$action] ?? ucfirst(str_replace('_', ' ', $action)),
                    'actor_name' => $row->actor_name ?? 'Sistem',
                    'created_at' => $row->created_at
                        ? Carbon::parse($row->created_at)->toIso8601String()
                        : null,
                ];
            })
            ->values();

        return response()->json([
            'attention' => $attention,
            'upcoming_events' => $upcomingEvents,
            'finance' => $finance,
            'recent_activity' => $recentActivity,
        ]);
    }
}
