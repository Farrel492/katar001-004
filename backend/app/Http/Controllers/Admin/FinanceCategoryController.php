<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFinanceCategoryRequest;
use App\Http\Requests\Admin\UpdateFinanceCategoryRequest;
use App\Models\FinanceCategory;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FinanceCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FinanceCategory::query();

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        $categories = $query->orderBy('type')->orderBy('name')->get();

        return response()->json($categories);
    }

    public function store(StoreFinanceCategoryRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['is_active'] = $validated['is_active'] ?? true;

        $category = FinanceCategory::create($validated);

        AuditLogger::log($request->user(), 'finance_category_created', $request, [
            'category_id' => $category->id,
            'name' => $category->name,
            'type' => $category->type,
        ]);

        return response()->json($category, 201);
    }

    public function update(UpdateFinanceCategoryRequest $request, FinanceCategory $category): JsonResponse
    {
        $validated = $request->validated();
        $category->update($validated);

        AuditLogger::log($request->user(), 'finance_category_updated', $request, [
            'category_id' => $category->id,
            'name' => $category->name,
        ]);

        return response()->json($category);
    }

    public function destroy(Request $request, FinanceCategory $category): JsonResponse
    {
        if ($category->transactions()->exists()) {
            throw ValidationException::withMessages([
                'category' => ['Kategori tidak dapat dihapus karena sudah memiliki transaksi terkait. Anda dapat menonaktifkannya agar tidak muncul pada pencatatan transaksi baru.'],
            ]);
        }

        $id = $category->id;
        $name = $category->name;
        $category->delete();

        AuditLogger::log($request->user(), 'finance_category_deleted', $request, [
            'category_id' => $id,
            'name' => $name,
        ]);

        return response()->json([
            'message' => 'Kategori berhasil dihapus.',
        ]);
    }
}
