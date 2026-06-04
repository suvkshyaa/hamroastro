<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Conversation;
use App\Models\User;

class ChatMessage extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_type',
        'sender_id',
        'message',
        'attachment',
        'is_read'
    ];

    /*
    |--------------------------------------------------------------------------
    | MESSAGE → CONVERSATION
    |--------------------------------------------------------------------------
    */
    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    /*
    |--------------------------------------------------------------------------
    | MESSAGE → ADMIN USER
    | Returns the admin user only when sender_type = 'admin'
    |--------------------------------------------------------------------------
    */
    public function admin()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Determine if sender is admin
    |--------------------------------------------------------------------------
    */
    public function isAdmin()
    {
        return $this->sender_type === 'admin';
    }

    /*
    |--------------------------------------------------------------------------
    | Determine if sender is customer
    |--------------------------------------------------------------------------
    */
    public function isCustomer()
    {
        return $this->sender_type === 'customer';
    }

    public function toArray()
{
    return [
        'id'              => $this->id,
        'conversation_id' => $this->conversation_id,
        'sender_type'     => $this->sender_type,
        'sender_id'       => $this->sender_id,
        'message'         => $this->message,
        'is_read'         => $this->is_read,
        'created_at'      => $this->created_at->toDateTimeString(),
    ];
}

}
