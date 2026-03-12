<?php

namespace App\Filament\Resources\PayoutRequestResource\Pages;

use App\Filament\Resources\PayoutRequestResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditPayoutRequest extends EditRecord
{
    protected static string $resource = PayoutRequestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
