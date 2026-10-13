<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\WalletService;
use Illuminate\Console\Command;

class ReconcileWalletsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'wallet:reconcile {--fix : Automatically adjust wallet balance to match ledger} {--user= : Specific user ID to reconcile}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reconcile wallet balances against the ledger transactions';

    public function handle(WalletService $walletService): int
    {
        $shouldFix = (bool) $this->option('fix');
        $userId = $this->option('user');

        $query = User::has('wallet');
        if ($userId) {
            $query->where('id', $userId);
        }

        $users = $query->with('wallet')->get();
        $discrepancies = [];

        foreach ($users as $user) {
            $result = $walletService->reconcileBalance($user, $shouldFix);
            if ($result['was_corrected'] || ! $result['is_reconciled']) {
                $discrepancies[] = [
                    'User ID' => $result['user_id'],
                    'Wallet ID' => $result['wallet_id'],
                    'Previous' => $result['previous_balance'],
                    'Current' => $result['current_balance'],
                    'Ledger' => $result['ledger_balance'],
                    'Diff' => $result['discrepancy'],
                    'Fixed' => $result['was_corrected'] ? 'Yes' : 'No',
                ];
            }
        }

        if (empty($discrepancies)) {
            $this->info("All {$users->count()} wallets are fully reconciled with the ledger!");

            return Command::SUCCESS;
        }

        $this->warn('Processed '.count($discrepancies).' wallet discrepancies:');
        $this->table(['User ID', 'Wallet ID', 'Previous', 'Current', 'Ledger', 'Diff', 'Fixed'], $discrepancies);

        return $shouldFix ? Command::SUCCESS : Command::FAILURE;
    }
}
