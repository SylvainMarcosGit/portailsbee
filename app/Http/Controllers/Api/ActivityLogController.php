<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Liste des logs d'activité
     */
    public function index(Request $request)
    {
        $query = ActivityLog::with('user.role')
            ->orderBy('created_at', 'desc');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 50);
        $logs = $query->paginate($perPage);

        $logs->getCollection()->transform(function ($log) {
            return [
                'id' => $log->id,
                'user' => $log->user ? [
                    'id' => $log->user->id,
                    'matricule' => $log->user->matricule,
                    'fullName' => $log->user->full_name,
                ] : null,
                'action' => $log->action,
                'description' => $log->description,
                'ipAddress' => $log->ip_address,
                'createdAt' => $log->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json($logs);
    }

    /**
     * Statistiques des activités
     */
    public function stats()
    {
        $today = now()->startOfDay();
        $thisWeek = now()->startOfWeek();
        $thisMonth = now()->startOfMonth();

        return response()->json([
            'stats' => [
                'today' => ActivityLog::where('created_at', '>=', $today)->count(),
                'thisWeek' => ActivityLog::where('created_at', '>=', $thisWeek)->count(),
                'thisMonth' => ActivityLog::where('created_at', '>=', $thisMonth)->count(),
                'logins' => ActivityLog::where('action', 'login')
                    ->where('created_at', '>=', $thisMonth)
                    ->count(),
            ],
        ]);
    }
}
