<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherPublicResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $profile = $this->teacherProfile;

        $profileData = $profile ? [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'subject_id' => $profile->subject_id,
            'bio' => $profile->bio,
            'is_verified' => (bool) $profile->is_verified,
            'average_rating' => (float) $profile->average_rating,
            'reviews_count' => (int) $profile->reviews_count,
            'subject' => $profile->subject ? [
                'id' => $profile->subject->id,
                'name' => $profile->subject->name,
                'grade_level_id' => $profile->subject->grade_level_id,
            ] : null,
        ] : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar_url' => $this->avatar_url,
            'is_active' => (bool) $this->is_active,
            'active_slots_count' => $this->active_slots_count ?? 0,
            'teacher_profile' => $profileData,
            'teacherProfile' => $profileData,
        ];
    }
}
