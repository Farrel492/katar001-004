<?php

namespace Database\Seeders;

use App\Models\OrganizationProfile;
use App\Models\OrganizationMember;
use Illuminate\Database\Seeder;

class OrganizationProfileSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Menggunakan nilai placeholder netral tanpa data pribadi/nomor telepon asli.
     */
    public function run(): void
    {
        OrganizationProfile::updateOrCreate(
            ['id' => 1],
            [
                'name' => 'Karang Taruna RT 001 RW 004',
                'short_name' => 'Katar 01/04',
                'tagline' => 'Generasi Muda Berkarya, Membangun Lingkungan Berdaya',
                'about' => 'Wadah pembinaan dan pengembangan generasi muda di lingkungan RT 001 RW 004, Kelurahan Jatibening Baru, yang bergerak dalam bidang sosial kemasyarakatan, kepemudaan, keolahragaan, dan pemberdayaan lingkungan.',
                'history' => 'Karang Taruna RT 001 RW 004 dibentuk atas dasar inisiatif pemuda dan dukungan tokoh masyarakat untuk mempererat kebersamaan warga serta menghidupkan kegiatan positif di lingkungan.',
                'vision' => 'Mewujudkan pemuda-pemudi RT 001 RW 004 yang berakhlak mulia, mandiri, peduli sosial, dan aktif berkontribusi nyata bagi keharmonisan lingkungan.',
                'missions' => [
                    'Mengembangkan potensi, bakat, dan kreativitas generasi muda di bidang kepemudaan dan kemasyarakatan.',
                    'Membangun kepedulian sosial dan gotong royong antarwarga lintas generasi.',
                    'Mendukung program kerja pengurus RT dan RW dalam memajukan lingkungan yang aman, bersih, dan harmonis.',
                    'Menghadirkan transparansi informasi kegiatan dan pengelolaan kas secara terbuka dan akuntabel.',
                ],
                'values' => [
                    'Kebersamaan',
                    'Integritas & Transparansi',
                    'Kepedulian Sosial',
                    'Semangat Gotong Royong',
                ],
                'address' => 'Jl. Kemang Sari 1 No. 4, RT 001 RW 004, Kelurahan Jatibening Baru, Kecamatan Pondok Gede, Kota Bekasi, Jawa Barat 17412',
                'region_label' => 'RT 001 RW 004, Kel. Jatibening Baru, Pondok Gede, Bekasi',
                'whatsapp' => '6281200000000',
                'email' => 'katar0104@example.org',
                'instagram' => 'https://instagram.com/karangtaruna0104',
                'facebook' => 'https://facebook.com/karangtaruna0104',
                'youtube' => 'https://youtube.com/@karangtaruna0104',
                'logo_path' => null,
            ]
        );

        // Seeder awal pengurus dengan posisi terstruktur netral jika belum ada
        if (OrganizationMember::count() === 0) {
            $defaultMembers = [
                [
                    'name' => 'Bapak Pembina Lingkungan',
                    'position' => 'Pembina (Ketua RT 001)',
                    'division' => 'Dewan Pembina',
                    'period' => '2025-2028',
                    'bio' => 'Memberikan arahan dan bimbingan moral bagi seluruh program kepemudaan karang taruna di lingkungan RT 001 RW 004.',
                    'sort_order' => 1,
                    'is_visible' => true,
                ],
                [
                    'name' => 'Ketua Karang Taruna',
                    'position' => 'Ketua Umum',
                    'division' => 'Pengurus Harian',
                    'period' => '2025-2028',
                    'bio' => 'Memimpin koordinasi dan pelaksanaan program kerja kepemudaan Karang Taruna RT 001 RW 004.',
                    'sort_order' => 2,
                    'is_visible' => true,
                ],
                [
                    'name' => 'Wakil Ketua Karang Taruna',
                    'position' => 'Wakil Ketua',
                    'division' => 'Pengurus Harian',
                    'period' => '2025-2028',
                    'bio' => 'Mendampingi ketua dan mengoordinasikan bidang-bidang teknis kepemudaan.',
                    'sort_order' => 3,
                    'is_visible' => true,
                ],
                [
                    'name' => 'Sekretaris Organisasi',
                    'position' => 'Sekretaris',
                    'division' => 'Administrasi & Humas',
                    'period' => '2025-2028',
                    'bio' => 'Mengelola ketatausahaan, dokumentasi rapat, dan persuratan resmi karang taruna.',
                    'sort_order' => 4,
                    'is_visible' => true,
                ],
                [
                    'name' => 'Bendahara Umum',
                    'position' => 'Bendahara',
                    'division' => 'Keuangan',
                    'period' => '2025-2028',
                    'bio' => 'Mencatat arus kas pemasukan dan pengeluaran kegiatan secara cermat dan akuntabel.',
                    'sort_order' => 5,
                    'is_visible' => true,
                ],
            ];

            foreach ($defaultMembers as $memberData) {
                OrganizationMember::create($memberData);
            }
        }
    }
}
