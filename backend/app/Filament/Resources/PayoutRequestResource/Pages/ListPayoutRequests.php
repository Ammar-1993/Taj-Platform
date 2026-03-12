<?php

namespace App\Filament\Resources\PayoutRequestResource\Pages;

use App\Filament\Resources\PayoutRequestResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListPayoutRequests extends ListRecords
{
    protected static string $resource = PayoutRequestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
