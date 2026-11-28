<?php

namespace App\Console\Commands;

use App\Models\Aspiration;
use Illuminate\Console\Command;

class PurgeAspirations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'aspirations:purge {--months=12 : Hapus permanen aspirasi berstatus selesai/spam/ditolak yang lebih tua dari N bulan}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Hapus permanen aspirasi berstatus done, spam, atau rejected yang lebih tua dari batas bulan tertentu';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $months = max(1, (int) $this->option('months'));
        $cutoff = now()->subMonths($months);

        $count = Aspiration::withTrashed()
            ->whereIn('status', ['done', 'spam', 'rejected'])
            ->where('created_at', '<=', $cutoff)
            ->forceDelete();

        $this->info("Berhasil membersihkan {$count} aspirasi kadaluarsa.");

        return Command::SUCCESS;
    }
}
