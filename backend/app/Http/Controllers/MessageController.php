<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use App\Events\MessageSent;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{

    // ─────────────────────────────────────────────
    // HELPER: Get current session start time
    // Session resets on: new paid question OR new ⭐ answer
    // ─────────────────────────────────────────────
    private function getSessionStart($customerId, $adminId)
    {
        $lastQuestion = Message::where('user_id', $customerId)
            ->where('receiver_id', $adminId)
            ->where('message_type', 'question')
            ->latest()
            ->first();

        $lastAnswer = Message::where('user_id', $adminId)
            ->where('receiver_id', $customerId)
            ->where('message_type', 'answer')
            ->latest()
            ->first();

        if ($lastQuestion && $lastAnswer) {
            return $lastQuestion->created_at->gt($lastAnswer->created_at)
                ? $lastQuestion->created_at
                : $lastAnswer->created_at;
        }

        if ($lastQuestion) return $lastQuestion->created_at;
        if ($lastAnswer)   return $lastAnswer->created_at;

        return null; // welcome session — no question or answer yet
    }

    // ─────────────────────────────────────────────
    // HELPER: Count normal messages sent after session start
    // ─────────────────────────────────────────────
    private function countNormalInSession($senderId, $receiverId, $sessionStart)
    {
        $query = Message::where('user_id', $senderId)
            ->where('receiver_id', $receiverId)
            ->where('message_type', 'normal');

        if ($sessionStart) {
            $query->where('created_at', '>', $sessionStart);
        }

        return $query->count();
    }


    // ─────────────────────────────────────────────
    // GET /messages  (index — query-string based)
    // ─────────────────────────────────────────────
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);

        $otherUserId = $request->query('receiver_id') ?? $request->query('user_id');
        if (!$otherUserId) return response()->json(['message' => 'user_id or receiver_id is required'], 400);

        $messages = Message::where(function ($q) use ($user, $otherUserId) {
            $q->where('user_id', $user->id)->where('receiver_id', $otherUserId);
        })->orWhere(function ($q) use ($user, $otherUserId) {
            $q->where('user_id', $otherUserId)->where('receiver_id', $user->id);
        })
            ->with('user:id,name')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($m) => $this->formatMessage($m));

        return response()->json($messages);
    }


    // ─────────────────────────────────────────────
    // GET /messages/{userId}  (show)
    // ─────────────────────────────────────────────
    public function show(Request $request, $userId)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);

        $messages = Message::where(function ($q) use ($user, $userId) {
            $q->where('user_id', $user->id)->where('receiver_id', $userId);
        })->orWhere(function ($q) use ($user, $userId) {
            $q->where('user_id', $userId)->where('receiver_id', $user->id);
        })
            ->with('user:id,name')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($m) => $this->formatMessage($m));

        return response()->json($messages);
    }


    // ─────────────────────────────────────────────
    // POST /messages  (store)
    // ─────────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'text'           => 'required|string|max:5000',
            'receiver_id'    => 'required|exists:users,id',
            'transaction_id' => 'nullable|string',
            'message_type'   => 'required|in:normal,question,answer',
            'question_id'    => 'nullable|integer',
        ]);

        $user = $request->user();
        if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);

        $messageType = $validated['message_type'];
        $receiverId  = $validated['receiver_id'];

        // ══════════════════════════════════════════
        // CUSTOMER: normal message limit
        // ══════════════════════════════════════════
        if ($messageType === 'normal' && $user->role === 'customer') {

            $sessionStart = $this->getSessionStart($user->id, $receiverId);

            if ($sessionStart === null) {
                // ── Welcome session (no question/answer yet) ──
                $freeUsed = $user->free_messages_used ?? 0;
                if ($freeUsed >= 3) {
                    return response()->json([
                        'error'        => 'You have used all 3 free welcome messages. Please ask a paid question to continue.',
                        'limit_reached' => true,
                        'limit_type'   => 'welcome',
                    ], 403);
                }
                $user->free_messages_used = $freeUsed + 1;
                $user->save();
            } else {
                // ── Active session (after question or after answer) ──
                $used = $this->countNormalInSession($user->id, $receiverId, $sessionStart);
                if ($used >= 3) {
                    return response()->json([
                        'error'        => 'You have used all 3 free messages for this session. Please ask a new paid question.',
                        'limit_reached' => true,
                        'limit_type'   => 'session',
                    ], 403);
                }
            }
        }

        // ══════════════════════════════════════════
        // ADMIN: normal message limit
        // ══════════════════════════════════════════
        if ($messageType === 'normal' && $user->role === 'admin') {
            $customerId   = $receiverId;
            $sessionStart = $this->getSessionStart($customerId, $user->id);

            if ($sessionStart !== null) {
                $used = $this->countNormalInSession($user->id, $customerId, $sessionStart);
                if ($used >= 3) {
                    return response()->json([
                        'error'        => 'You have used all 3 clarification messages for this session. Please send the ⭐ Answer now.',
                        'limit_reached' => true,
                        'limit_type'   => 'admin_session',
                    ], 403);
                }
            }
            // If no session yet → admin is in welcome session → 3 free, no hard limit enforced
        }

        // ══════════════════════════════════════════
        // PAYMENT: questions require transaction ID
        // ══════════════════════════════════════════
        $isPaid        = false;
        $paymentStatus = 'free';
        $amount        = 0;

        if ($messageType === 'question' && $user->role !== 'admin') {
            if (!empty($validated['transaction_id'])) {
                $existing = Message::where('transaction_id', $validated['transaction_id'])->first();
                if ($existing) {
                    return response()->json([
                        'error'            => 'यो Transaction ID पहिले नै प्रयोग भइसकेको छ।',
                        'requires_payment' => true,
                    ], 400);
                }
                $isPaid        = true;
                $paymentStatus = 'paid';
                $amount        = 20.00;
            } else {
                return response()->json([
                    'error'            => 'Payment required for questions',
                    'requires_payment' => true,
                    'amount'           => 20.00,
                ], 402);
            }
        }

        // ══════════════════════════════════════════
        // CREATE MESSAGE
        // ══════════════════════════════════════════
        $message = Message::create([
            'user_id'        => $user->id,
            'receiver_id'    => $receiverId,
            'text'           => $validated['text'],
            'message_type'   => $messageType,
            'question_id'    => $validated['question_id'] ?? null,
            'is_paid'        => $isPaid,
            'payment_status' => $paymentStatus,
            'amount'         => $amount,
            'transaction_id' => $validated['transaction_id'] ?? null,
            'paid_at'        => $isPaid ? now() : null,
        ]);

        $message->load('user:id,name');

        try {
            broadcast(new MessageSent($message));
        } catch (\Exception $e) {
            Log::error("Broadcast failed: " . $e->getMessage());
        }

        return response()->json([
            'id'             => $message->id,
            'text'           => $message->text,
            'user_id'        => $message->user_id,
            'receiver_id'    => $message->receiver_id,
            'is_read'        => $message->is_read ?? false,
            'message_type'   => $message->message_type,
            'question_id'    => $message->question_id,
            'is_paid'        => $message->is_paid,
            'payment_status' => $message->payment_status,
            'transaction_id' => $message->transaction_id,
            'amount'         => $message->amount,
            'created_at'     => $message->created_at->toISOString(),
            'sender_name'    => $message->user->name ?? 'Unknown',
        ], 201);
    }


    // ─────────────────────────────────────────────
    // GET /messages/free-status
    // Returns remaining normal messages for current session
    // ─────────────────────────────────────────────
    public function getFreeMessageStatus(Request $request)
    {
        $user    = $request->user();
        $adminId = $request->query('admin_id') ?? 1;

        $sessionStart = $this->getSessionStart($user->id, $adminId);

        if ($sessionStart === null) {
            // Welcome session
            $globalUsed       = $user->free_messages_used ?? 0;
            $sessionRemaining = max(0, 3 - $globalUsed);
            $sessionType      = 'welcome';
        } else {
            $used             = $this->countNormalInSession($user->id, $adminId, $sessionStart);
            $sessionRemaining = max(0, 3 - $used);
            $sessionType      = 'active';
        }

        // Last question and last answer for the frontend to track
        $lastQuestion = Message::where('user_id', $user->id)
            ->where('receiver_id', $adminId)
            ->where('message_type', 'question')
            ->latest()->first();

        $lastAnswer = Message::where('user_id', $adminId)
            ->where('receiver_id', $user->id)
            ->where('message_type', 'answer')
            ->latest()->first();

        return response()->json([
            'session_remaining'    => $sessionRemaining,
            'session_type'         => $sessionType,
            // kept for backward compat with existing frontend code
            'global_remaining'     => $sessionRemaining,
            'per_question_remaining' => $sessionRemaining,
            'global_used'          => $user->free_messages_used ?? 0,
            'last_question_id'     => $lastQuestion?->id,
            'last_answer_id'       => $lastAnswer?->id,
            'has_paid_question'    => $lastQuestion !== null,
        ]);
    }


    // ─────────────────────────────────────────────
    // GET /chat-users  (admin sidebar)
    // ─────────────────────────────────────────────
    public function chatUsers(Request $request)
    {
        $currentUser = $request->user();
        if (!$currentUser) return response()->json(['message' => 'Unauthenticated.'], 401);

        $users = User::where('id', '!=', $currentUser->id)
            ->where('role', 'customer')
            ->get()
            ->map(function ($user) use ($currentUser) {
                $lastMessage = Message::where(function ($q) use ($currentUser, $user) {
                    $q->where('user_id', $currentUser->id)->where('receiver_id', $user->id);
                })->orWhere(function ($q) use ($currentUser, $user) {
                    $q->where('user_id', $user->id)->where('receiver_id', $currentUser->id);
                })->latest()->first();

                $unreadCount = Message::where('user_id', $user->id)
                    ->where('receiver_id', $currentUser->id)
                    ->where('is_read', false)
                    ->count();

                return [
                    'id'           => $user->id,
                    'name'         => $user->name,
                    'email'        => $user->email,
                    'gender'       => $user->gender ?? null,
                    'dob'          => $user->dob ?? null,
                    'dob_nep'      => $user->dob_nep ?? null,
                    'birth_time'   => $user->birth_time ?? null,
                    'birth_place'  => $user->birth_place ?? null,
                    'birth_city'   => $user->birth_city ?? null,
                    'birth_country' => $user->birth_country ?? null,
                    'temp_country' => $user->temp_country ?? null,
                    'temp_city'    => $user->temp_city ?? null,
                    'temp_street'  => $user->temp_street ?? null,
                    'temp_address' => $user->temp_address ?? null,
                    'perm_country' => $user->perm_country ?? null,
                    'perm_city'    => $user->perm_city ?? null,
                    'perm_street'  => $user->perm_street ?? null,
                    'perm_address' => $user->perm_address ?? null,
                    'unread_count' => $unreadCount,
                    'last_message' => $lastMessage ? [
                        'id'          => $lastMessage->id,
                        'text'        => $lastMessage->text,
                        'user_id'     => $lastMessage->user_id,
                        'receiver_id' => $lastMessage->receiver_id,
                        'created_at'  => $lastMessage->created_at->toISOString(),
                    ] : null,
                ];
            })
            ->sortByDesc(fn($u) => $u['last_message']['created_at'] ?? '1970-01-01')
            ->values();

        return response()->json($users);
    }


    // ─────────────────────────────────────────────
    // GET /users  (all users)
    // ─────────────────────────────────────────────
    public function allUsers(Request $request)
    {
        $currentUser = $request->user();
        if (!$currentUser) return response()->json(['message' => 'Unauthenticated.'], 401);

        $users = User::where('id', '!=', $currentUser->id)
            ->select('id', 'name', 'email', 'dob_nep', 'birth_time', 'birth_place', 'temp_address')
            ->get();

        return response()->json($users);
    }


    // ─────────────────────────────────────────────
    // POST /messages/mark-read
    // ─────────────────────────────────────────────
    public function markAsRead(Request $request)
    {
        $user     = $request->user();
        $senderId = $request->input('sender_id');

        Message::where('user_id', $senderId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Messages marked as read']);
    }


    // ─────────────────────────────────────────────
    // GET /check-payment
    // ─────────────────────────────────────────────
    public function checkPayment(Request $request)
    {
        $user        = $request->user();
        $receiverId  = $request->query('receiver_id');
        $messageType = $request->query('message_type', 'normal');

        if (!$user || !$receiverId) return response()->json(['error' => 'Invalid request'], 400);

        if ($user->role === 'admin') {
            return response()->json(['requires_payment' => false, 'message_type' => $messageType, 'amount' => 0]);
        }

        $requiresPayment = ($messageType === 'question');

        return response()->json([
            'requires_payment' => $requiresPayment,
            'message_type'     => $messageType,
            'amount'           => $requiresPayment ? 20.00 : 0,
        ]);
    }


    // ─────────────────────────────────────────────
    // GET /admin-info
    // ─────────────────────────────────────────────
    public function getAdminId()
    {
        $admin = User::where('role', 'admin')->first();
        if (!$admin) return response()->json(['error' => 'No admin available'], 404);

        return response()->json(['admin_id' => $admin->id, 'admin_name' => $admin->name]);
    }


    // ─────────────────────────────────────────────
    // POST /typing
    // ─────────────────────────────────────────────
    public function typing(Request $request)
    {
        $user       = $request->user();
        $receiverId = $request->input('receiver_id');
        if (!$receiverId) return response()->json(['error' => 'receiver_id required'], 400);

        broadcast(new \App\Events\UserTyping($user->id, $receiverId, $user->name));

        return response()->json(['message' => 'Typing event sent']);
    }


    // ─────────────────────────────────────────────
    // POST /status/online
    // ─────────────────────────────────────────────
    public function setOnline(Request $request)
    {
        $user = $request->user();
        cache()->put("user_online_{$user->id}", true, now()->addSeconds(60));
        return response()->json(['status' => 'online']);
    }


    // ─────────────────────────────────────────────
    // GET /status/{userId}
    // ─────────────────────────────────────────────
    public function getStatus(Request $request, $userId)
    {
        return response()->json([
            'user_id'   => $userId,
            'is_online' => cache()->has("user_online_{$userId}"),
        ]);
    }


    // ─────────────────────────────────────────────
    // POST /messages/{messageId}/payment  (admin marks payment)
    // ─────────────────────────────────────────────
    public function markPayment(Request $request, $messageId)
    {
        $user = $request->user();
        if ($user->role !== 'admin') return response()->json(['error' => 'Unauthorized'], 403);

        $validated = $request->validate(['payment_status' => 'required|in:paid,rejected']);
        $message   = Message::findOrFail($messageId);

        if ($message->message_type !== 'question') {
            return response()->json(['error' => 'Only questions can be marked'], 400);
        }

        $message->payment_status = $validated['payment_status'];
        $message->is_paid        = $validated['payment_status'] === 'paid';
        $message->paid_at        = $validated['payment_status'] === 'paid' ? now() : null;
        $message->save();

        return response()->json([
            'id'             => $message->id,
            'payment_status' => $message->payment_status,
            'is_paid'        => $message->is_paid,
        ]);
    }


    // ─────────────────────────────────────────────
    // POST /users/{userId}/rashi  (admin sets rashi)
    // ─────────────────────────────────────────────
    public function updateRashi(Request $request, $userId)
    {
        $user = $request->user();
        if ($user->role !== 'admin') return response()->json(['error' => 'Unauthorized'], 403);

        $validated = $request->validate(['rashi' => 'required|string|max:100']);
        $customer  = User::findOrFail($userId);
        $customer->rashi = $validated['rashi'];
        $customer->save();

        return response()->json(['message' => 'Rashi updated successfully', 'rashi' => $customer->rashi]);
    }


    // ─────────────────────────────────────────────
    // PRIVATE: format a message for API response
    // ─────────────────────────────────────────────
    private function formatMessage($message)
    {
        return [
            'id'             => $message->id,
            'text'           => $message->text,
            'user_id'        => $message->user_id,
            'receiver_id'    => $message->receiver_id,
            'message_type'   => $message->message_type ?? 'normal',
            'question_id'    => $message->question_id ?? null,
            'is_paid'        => $message->is_paid ?? false,
            'payment_status' => $message->payment_status,
            'transaction_id' => $message->transaction_id ?? null,
            'is_read'        => $message->is_read ?? false,
            'created_at'     => $message->created_at->toISOString(),
            'updated_at'     => $message->updated_at->toISOString(),
            'sender_name'    => $message->user->name ?? 'Unknown',
        ];
    }
}
