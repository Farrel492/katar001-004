<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateFinanceSettingsRequest;
use App\Models\FinanceSetting;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceSettingController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = FinanceSetting::getSettings();
        $settings->load('updater:id,name,username');

        return response()->json($settings);
    }

    public function update(UpdateFinanceSettingsRequest $request): JsonResponse
    {
        $settings = FinanceSetting::getSettings();
        $oldBalance = (int) $settings->opening_balance;
        $oldDate = is_string($settings->opening_date) ? $settings->opening_date : $settings->opening_date->toDateString();

        $validated = $request->validated();
        $validated['updated_by'] = $request->user()->id;

        $settings->update($validated);

        // Catat audit dengan nilai lama dan nilai baru
        AuditLogger::log($request->user(), 'finance_opening_changed', $request, [
            'old_balance' => $oldBalance,
            'new_balance' => (int) $validated['opening_balance'],
            'old_date' => $oldDate,
            'new_date' => $validated['opening_date'],
        ]);

        $settings->load('updater:id,name,username');

        return response()->json($settings);
    }
}
