<?php

namespace Database\Seeders;

use App\Models\FinanceCategory;
use App\Models\FinanceSetting;
use Illuminate\Database\Seeder;

class FinanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $incomes = ['Iuran Warga', 'Donasi', 'Hasil Kegiatan', 'Lainnya'];
        foreach ($incomes as $name) {
            FinanceCategory::firstOrCreate(
                ['name' => $name, 'type' => 'income'],
                ['is_active' => true]
            );
        }

        $expenses = ['Kegiatan', 'Konsumsi', 'Perlengkapan', 'Sosial', 'Administrasi', 'Lainnya'];
        foreach ($expenses as $name) {
            FinanceCategory::firstOrCreate(
                ['name' => $name, 'type' => 'expense'],
                ['is_active' => true]
            );
        }

        FinanceSetting::firstOrCreate([], [
            'opening_balance' => 0,
            'opening_date' => now()->startOfYear()->toDateString(),
        ]);
    }
}
