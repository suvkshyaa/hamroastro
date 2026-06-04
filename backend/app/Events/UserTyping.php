<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $receiverId;
    public $userName;

    public function __construct($userId, $receiverId, $userName)
    {
        $this->userId = $userId;
        $this->receiverId = $receiverId;
        $this->userName = $userName;
    }

    public function broadcastOn()
    {
        // ✅ Broadcast on receiver's private channel
        return new PrivateChannel("chat.{$this->receiverId}");
    }

    public function broadcastAs()
    {
        return 'UserTyping';
    }

    public function broadcastWith()
    {
        return [
            'user_id'     => $this->userId,
            'receiver_id' => $this->receiverId,
            'user_name'   => $this->userName,
        ];
    }
}
