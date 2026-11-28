<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\FinanceCategory;
use App\Models\FinanceTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $year = (int) $request->query('year', date('Y'));

        // Saldo total saat ini (integer)
        $currentBalance = FinanceTransaction::calculateCurrentBalance();

        // Transaksi published di tahun yang diminta
        $yearTransactions = FinanceTransaction::where('status', 'published')
            ->whereYear('transaction_date', $year)
            ->get();

        $totalIncomeYear = (int) $yearTransactions->where('type', 'income')->sum('amount');
        $totalExpenseYear = (int) $yearTransactions->where('type', 'expense')->sum('amount');
        $netYear = $totalIncomeYear - $totalExpenseYear;

        // Rincian per bulan (1 - 12)
        $monthly = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthPad = str_pad((string) $m, 2, '0', STR_PAD_LEFT);
            $prefix = "{$year}-{$monthPad}";

            $mTx = $yearTransactions->filter(function ($tx) use ($prefix) {
                $dateStr = is_string($tx->transaction_date) ? $tx->transaction_date : $tx->transaction_date->toDateString();
                return str_starts_with($dateStr, $prefix);
            });

            $inc = (int) $mTx->where('type', 'income')->sum('amount');
            $exp = (int) $mTx->where('type', 'expense')->sum('amount');

            $monthly[] = [
                'month' => $m,
                'income' => $inc,
                'expense' => $exp,
                'net' => $inc - $exp,
            ];
        }

        // Rincian per kategori untuk tahun ini
        $categories = FinanceCategory::all()->keyBy('id');

        $byCategoryIncome = [];
        $byCategoryExpense = [];

        $groupedCategory = $yearTransactions->groupBy('category_id');
        foreach ($groupedCategory as $catId => $txs) {
            $cat = $categories->get($catId);
            $catName = $cat ? $cat->name : 'Lainnya';
            $type = $cat ? $cat->type : ($txs->first()->type ?? 'expense');
            $sum = (int) $txs->sum('amount');

            $item = [
                'category_id' => $catId,
                'name' => $catName,
                'total' => $sum,
            ];

            if ($type === 'income') {
                $byCategoryIncome[] = $item;
            } else {
                $byCategoryExpense[] = $item;
            }
        }

        // Urutkan kategori berdasarkan total terbesar
        usort($byCategoryIncome, fn ($a, $b) => $b['total'] <=> $a['total']);
        usort($byCategoryExpense, fn ($a, $b) => $b['total'] <=> $a['total']);

        return response()->json([
            'balance' => $currentBalance,
            'year' => $year,
            'total_income_year' => $totalIncomeYear,
            'total_expense_year' => $totalExpenseYear,
            'net_year' => $netYear,
            'monthly' => $monthly,
            'by_category' => [
                'income' => $byCategoryIncome,
                'expense' => $byCategoryExpense,
            ],
        ])->header('Cache-Control', 'public, max-age=60');
    }

    public function transactions(Request $request): JsonResponse
    {
        $query = FinanceTransaction::query()
            ->where('status', 'published')
            ->with('category:id,name,type');

        if ($request->filled('month')) {
            $month = trim($request->query('month')); // format YYYY-MM
            $query->where('transaction_date', 'like', "{$month}%");
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }

        $paginated = $query->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(20);

        $paginated->getCollection()->transform(function ($item) {
            return [
                'id' => $item->id,
                'transaction_date' => is_string($item->transaction_date) ? $item->transaction_date : $item->transaction_date->toDateString(),
                'type' => $item->type,
                'category' => $item->category ? $item->category->name : '-',
                'category_id' => $item->category_id,
                'amount' => (int) $item->amount,
                'description' => $item->description,
                'counterparty_label' => $item->counterparty_public ? $item->counterparty : ($item->counterparty ? 'Warga/Donatur' : null),
                'is_correction' => $item->corrects_id !== null,
                'corrects_id' => $item->corrects_id,
                'correction_reason' => $item->correction_reason,
            ];
        });

        return response()->json($paginated)
            ->header('Cache-Control', 'public, max-age=60');
    }
}
