<?php

namespace App\Http\Requests\Parent;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @property string $name
 * @property string $email
 * @property string $password
 * @property int $grade_level_id
 */
class StoreChildRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('parent');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:6'],
            'grade_level_id' => ['required', 'exists:grade_levels,id'],
        ];
    }
}