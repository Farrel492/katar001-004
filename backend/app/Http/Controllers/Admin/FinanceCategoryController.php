<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFinanceCategoryRequest;
use App\Http\Requests\Admin\UpdateFinanceCategoryRequest;
use App\Models\FinanceCategory;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
}
