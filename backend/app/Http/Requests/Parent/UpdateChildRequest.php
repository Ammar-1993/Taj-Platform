<?php

namespace App\Http\Requests\Parent;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @property string $name
 * @property int $grade_level_id
 */
class UpdateChildRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('parent');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'grade_level_id' => ['required', 'exists:grade_levels,id'],
        ];
    }
}
