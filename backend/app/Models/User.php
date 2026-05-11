<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Models\Contracts\HasAvatar;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 */
class User extends Authenticatable implements FilamentUser, HasAvatar
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected $guarded = ['id'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'metadata' => 'array',
        ];
    }

    // 🔒 جدار الحماية: من يُسمح له بدخول لوحة التحكم؟
    public function canAccessPanel(Panel $panel): bool
    {
        // فقط المستخدم الذي يمتلك دور "admin" يمكنه الدخول
        return $this->hasRole('admin');
    }

    // 🎨 تخصيص أيقونة المستخدم في القائمة العلوية
    public function getFilamentAvatarUrl(): ?string
    {
        $name = urlencode($this->name);

        return "https://ui-avatars.com/api/?name={$name}&color=ffffff&background=1D4ED8&bold=true&rounded=true";
    }

    // --- العلاقات (كما هي لم تتغير) ---

    public function parent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(User::class, 'parent_id');
    }

    public function teacherProfile(): HasOne
    {
        return $this->hasOne(TeacherProfile::class);
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    public function studentBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'student_id');
    }

    public function bookedBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'booked_by_id');
    }

    public function teacherBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'teacher_id');
    }

    public function teacherSlots(): HasMany
    {
        return $this->hasMany(TeacherSlot::class, 'teacher_id');
    }

    public function payoutRequests(): HasMany
    {
        return $this->hasMany(PayoutRequest::class);
    }
}
