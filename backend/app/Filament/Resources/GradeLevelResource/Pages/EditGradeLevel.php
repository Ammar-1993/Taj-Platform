<?php

namespace App\Filament\Resources\GradeLevelResource\Pages;

use App\Filament\Resources\GradeLevelResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditGradeLevel extends EditRecord
{
    protected static string $resource = GradeLevelResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
