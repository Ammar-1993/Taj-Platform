<?php

namespace App\Events;

use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WalletUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $user,
        public float $balance,
        public ?WalletTransaction $transaction = null
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.'.$this->user->id),
        ];
    }

    /**
     * Data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->user->id,
            'balance' => $this->balance,
            'transaction' => $this->transaction ? [
                'id' => $this->transaction->id,
                'amount' => $this->transaction->amount,
                'type' => $this->transaction->type,
                'description' => $this->transaction->description,
                'created_at' => $this->transaction->created_at?->toISOString(),
            ] : null,
        ];
    }
}
