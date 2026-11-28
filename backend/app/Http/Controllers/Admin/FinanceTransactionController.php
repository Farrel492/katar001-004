<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CorrectTransactionRequest;
use App\Http\Requests\Admin\StoreTransactionRequest;
use App\Http\Requests\Admin\UpdateTransactionRequest;
use App\Models\FinanceTransaction;
use App\Services\AuditLogger;
use App\Services\ImageUploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinanceTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FinanceTransaction::query()
            ->with(['category:id,name,type', 'creator:id,name,username', 'updater:id,name,username']);

        if ($request->filled('month')) {
            $month = trim($request->query('month'));
            $query->where('transaction_date', 'like', "{$month}%");
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->query('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', $search)
                  ->orWhere('counterparty', 'like', $search);
            });
        }

        $transactions = $query->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(20);

        return response()->json($transactions);
    }

    public function store(StoreTransactionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['status'] = $validated['status'] ?? 'draft';
        $validated['created_by'] = $request->user()->id;
        $validated['updated_by'] = $request->user()->id;

        if ($validated['status'] === 'published') {
            $validated['published_at'] = now();
        }

        $transaction = FinanceTransaction::create($validated);

        AuditLogger::log($request->user(), 'finance_tx_created', $request, [
            'transaction_id' => $transaction->id,
            'type' => $transaction->type,
            'amount' => (int) $transaction->amount,
            'status' => $transaction->status,
        ]);

        $transaction->load(['category:id,name,type', 'creator:id,name,username']);

        return response()->json($transaction, 201);
    }

    public function show(FinanceTransaction $transaction): JsonResponse
    {
        $transaction->load([
            'category:id,name,type',
            'creator:id,name,username',
            'updater:id,name,username',
            'originalTransaction:id,transaction_date,type,amount,description',
            'corrections:id,transaction_date,type,amount,description,correction_reason',
        ]);

        return response()->json($transaction);
    }

    public function update(UpdateTransactionRequest $request, FinanceTransaction $transaction): JsonResponse
    {
        $validated = $request->validated();
        $validated['updated_by'] = $request->user()->id;

        $transaction->update($validated);

        AuditLogger::log($request->user(), 'finance_tx_updated', $request, [
            'transaction_id' => $transaction->id,
            'amount' => (int) $transaction->amount,
        ]);

        $transaction->load(['category:id,name,type', 'updater:id,name,username']);

        return response()->json($transaction);
    }

    public function destroy(Request $request, FinanceTransaction $transaction): JsonResponse
    {
        $id = $transaction->id;
        $status = $transaction->status;
        $amount = (int) $transaction->amount;
        $transaction->delete();

        AuditLogger::log($request->user(), 'finance_tx_deleted', $request, [
            'transaction_id' => $id,
            'status' => $status,
            'amount' => $amount,
        ]);

        return response()->json([
            'message' => 'Transaksi berhasil dihapus.',
        ]);
    }

    public function publish(Request $request, FinanceTransaction $transaction): JsonResponse
    {
        if ($transaction->status === 'published') {
            throw ValidationException::withMessages([
                'status' => ['Transaksi ini sudah berstatus terbit.'],
            ]);
        }

        $transaction->update([
            'status' => 'published',
            'published_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log($request->user(), 'finance_tx_published', $request, [
            'transaction_id' => $transaction->id,
            'amount' => (int) $transaction->amount,
        ]);

        $transaction->load(['category:id,name,type', 'updater:id,name,username']);

        return response()->json($transaction);
    }

    public function unpublish(Request $request, FinanceTransaction $transaction): JsonResponse
    {
        if ($transaction->status === 'draft') {
            throw ValidationException::withMessages([
                'status' => ['Transaksi ini sudah berstatus draft.'],
            ]);
        }

        $transaction->update([
            'status' => 'draft',
            'published_at' => null,
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log($request->user(), 'finance_tx_unpublished', $request, [
            'transaction_id' => $transaction->id,
            'amount' => (int) $transaction->amount,
        ]);

        $transaction->load(['category:id,name,type', 'updater:id,name,username']);

        return response()->json($transaction);
    }

    public function correct(CorrectTransactionRequest $request, FinanceTransaction $transaction): JsonResponse
    {
        // Hanya transaksi published yang boleh dikoreksi
        if ($transaction->status !== 'published') {
            throw ValidationException::withMessages([
                'status' => ['Hanya transaksi yang sudah diterbitkan yang dapat dikoreksi.'],
            ]);
        }

        // Entri pembalik tidak bisa dikoreksi
        if ($transaction->corrects_id !== null) {
            throw ValidationException::withMessages([
                'corrects_id' => ['Entri koreksi pembalik tidak dapat dikoreksi kembali.'],
            ]);
        }

        // Satu transaksi hanya boleh dikoreksi sekali
        $alreadyCorrected = FinanceTransaction::where('corrects_id', $transaction->id)->exists();
        if ($alreadyCorrected) {
            throw ValidationException::withMessages([
                'corrects_id' => ['Transaksi ini sudah pernah dikoreksi sebelumnya.'],
            ]);
        }

        $validated = $request->validated();
        $reason = $validated['correction_reason'];
        $replacement = $validated['replacement'] ?? null;
        $userId = $request->user()->id;

        $results = DB::transaction(function () use ($transaction, $reason, $replacement, $userId, $request) {
            // 1. Buat entri pembalik published (tipe berlawanan, nominal sama)
            $reversingType = $transaction->type === 'income' ? 'expense' : 'income';
            $reversingDate = is_string($transaction->transaction_date) ? $transaction->transaction_date : $transaction->transaction_date->toDateString();

            $reversingEntry = FinanceTransaction::create([
                'type' => $reversingType,
                'category_id' => $transaction->category_id,
                'amount' => (int) $transaction->amount,
                'transaction_date' => $reversingDate,
                'description' => 'Koreksi pembalik: ' . $transaction->description,
                'counterparty' => $transaction->counterparty,
                'counterparty_public' => (bool) $transaction->counterparty_public,
                'status' => 'published',
                'published_at' => now(),
                'corrects_id' => $transaction->id,
                'correction_reason' => $reason,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            $replacementEntry = null;
            // 2. Bila replacement ada, buat transaksi pengganti published
            if ($replacement) {
                $replacementEntry = FinanceTransaction::create([
                    'type' => $replacement['type'],
                    'category_id' => $replacement['category_id'],
                    'amount' => (int) $replacement['amount'],
                    'transaction_date' => $replacement['transaction_date'],
                    'description' => $replacement['description'],
                    'counterparty' => $replacement['counterparty'] ?? null,
                    'counterparty_public' => (bool) ($replacement['counterparty_public'] ?? false),
                    'status' => 'published',
                    'published_at' => now(),
                    'corrects_id' => $transaction->id,
                    'correction_reason' => 'Pengganti transaksi: ' . $reason,
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]);
            }

            // Catat audit
            AuditLogger::log($request->user(), 'finance_tx_corrected', $request, [
                'original_id' => $transaction->id,
                'reversing_id' => $reversingEntry->id,
                'replacement_id' => $replacementEntry?->id,
                'reason' => $reason,
            ]);

            return [
                'reversing' => $reversingEntry,
                'replacement' => $replacementEntry,
            ];
        });

        return response()->json([
            'message' => 'Transaksi berhasil dikoreksi.',
            'reversing_transaction' => $results['reversing'],
            'replacement_transaction' => $results['replacement'],
        ], 201);
    }

    public function uploadProof(Request $request, FinanceTransaction $transaction): JsonResponse
    {
        $request->validate([
            'proof' => ['required', 'file'],
        ], [
            'proof.required' => 'Berkas bukti nota wajib dipilih.',
        ]);

        $uploader = new ImageUploader();
        // Simpan ke disk private 'local'
        $path = $uploader->upload($request->file('proof'), 'finance_proofs', $transaction->proof_path, 'proof', 'local');

        $transaction->update([
            'proof_path' => $path,
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log($request->user(), 'finance_proof_changed', $request, [
            'transaction_id' => $transaction->id,
            'action' => 'upload',
        ]);

        return response()->json([
            'message' => 'Bukti nota berhasil diunggah.',
            'proof_path' => $path,
        ]);
    }

    public function deleteProof(Request $request, FinanceTransaction $transaction): JsonResponse
    {
        if ($transaction->proof_path) {
            $uploader = new ImageUploader();
            $uploader->delete($transaction->proof_path, 'local');

            $transaction->update([
                'proof_path' => null,
                'updated_by' => $request->user()->id,
            ]);

            AuditLogger::log($request->user(), 'finance_proof_changed', $request, [
                'transaction_id' => $transaction->id,
                'action' => 'delete',
            ]);
        }

        return response()->json([
            'message' => 'Bukti nota berhasil dihapus.',
        ]);
    }

    public function getProof(FinanceTransaction $transaction)
    {
        if (! $transaction->proof_path || ! Storage::disk('local')->exists($transaction->proof_path)) {
            return response()->json([
                'message' => 'Berkas bukti nota tidak ditemukan.',
            ], 404);
        }

        return Storage::disk('local')->response($transaction->proof_path);
    }

    public function export(Request $request): StreamedResponse
    {
        $query = FinanceTransaction::query()->with('category:id,name,type');

        if ($request->filled('month')) {
            $month = trim($request->query('month'));
            $query->where('transaction_date', 'like', "{$month}%");
        } elseif ($request->filled('year')) {
            $year = trim($request->query('year'));
            $query->where('transaction_date', 'like', "{$year}%");
        }

        $transactions = $query->orderBy('transaction_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        AuditLogger::log($request->user(), 'finance_exported', $request, [
            'month' => $request->query('month'),
            'year' => $request->query('year'),
            'count' => $transactions->count(),
        ]);

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="laporan-keuangan-' . date('Ymd-His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        // Fungsi sanitasi formula injection
        $sanitize = function ($value): string {
            $str = (string) $value;
            if ($str !== '' && in_array($str[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
                return "'" . $str;
            }
            return $str;
        };

        return response()->stream(function () use ($transactions, $sanitize) {
            $handle = fopen('php://output', 'w');

            // BOM UTF-8 untuk Excel
            fwrite($handle, "\xEF\xBB\xBF");

            // Header CSV
            fputcsv($handle, [
                'ID Transaksi',
                'Tanggal',
                'Jenis',
                'Kategori',
                'Nominal (Rp)',
                'Keterangan',
                'Pihak Terkait',
                'Status',
                'Koreksi',
                'Alasan Koreksi',
            ]);

            foreach ($transactions as $tx) {
                $dateStr = is_string($tx->transaction_date) ? $tx->transaction_date : $tx->transaction_date->toDateString();
                $typeLabel = $tx->type === 'income' ? 'Pemasukan' : 'Pengeluaran';
                $catName = $tx->category ? $tx->category->name : '-';
                $counterparty = $tx->counterparty ?: '-';
                $isCorrection = $tx->corrects_id ? 'Ya' : 'Tidak';

                fputcsv($handle, [
                    $sanitize($tx->id),
                    $sanitize($dateStr),
                    $sanitize($typeLabel),
                    $sanitize($catName),
                    $sanitize((int) $tx->amount),
                    $sanitize($tx->description),
                    $sanitize($counterparty),
                    $sanitize($tx->status),
                    $sanitize($isCorrection),
                    $sanitize($tx->correction_reason ?: '-'),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
