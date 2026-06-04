<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;
use App\Models\Message;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message->load('user:id,name');
    }

    // ✅ Added broadcastAs
    public function broadcastAs()
    {
        return 'MessageSent';
    }

    // ✅ Only receiver's channel
    public function broadcastOn()
    {
        return new PrivateChannel('chat.' . $this->message->receiver_id);
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->message->id,
            'text' => $this->message->text,
            'user_id' => $this->message->user_id,
            'receiver_id' => $this->message->receiver_id,
            'message_type' => $this->message->message_type ?? 'normal',
            'is_paid' => $this->message->is_paid ?? false,
            'payment_status' => $this->message->payment_status,
            'transaction_id' => $this->message->transaction_id,
            'amount' => $this->message->amount,
            'created_at' => $this->message->created_at->toISOString(),
            'sender_name' => $this->message->user->name ?? 'Unknown',
        ];
    }
}
