<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // مسح كاش الصلاحيات لتجنب الأخطاء
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // إنشاء الأدوار (Roles)
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'teacher']);
        Role::create(['name' => 'student']);
        Role::create(['name' => 'parent']);
    }
}