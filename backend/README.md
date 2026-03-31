SA55 8000 0012 3456 7890 1234

docker-compose exec laravel.test php artisan migrate:fresh --seed

token:1|noTkwRH9THg5Xb2rPs4MEiXpg5mdx8hgrnvuq6vE3a886a53


الآن سجل دخولك بحساب الإدارة: admin@taj.com / 12345678.
سجل الدخول كمعلم (teacher@taj.com / 12345678).
سجل الدخول كطالب (student@taj.com / 12345678).
سجل الدخول كولي أمر (parent@taj.com / 12345678).
سيتم توجيهك لصفحة الدخول. الآن، سجل دخولك ببيانات الابن الجديد:
الإيميل: yasser@taj.com
الباسوورد: 12345678



docker-compose exec laravel.test php artisan optimize:clear

docker-compose exec laravel.test php artisan cache:clear


docker-compose exec laravel.test rm -rf public/storage
docker-compose exec laravel.test php artisan storage:link

docker-compose up -d
docker-compose stop


docker-compose exec laravel.test tail -n 20 storage/logs/laravel.log


docker-compose exec laravel.test php artisan tinker --execute="DB::statement('ALTER TABLE wallet_transactions MODIFY type VARCHAR(50)');"

اكتب في مربع كود الخصم: TAJ2026.

docker-compose exec laravel.test php artisan tinker --execute="\$t = App\Models\User::where('email', 'teacher@taj.com')->first(); App\Models\TeacherSlot::create(['teacher_id' => \$t->id, 'slot_date' => now()->addDays(1)->format('Y-m-d'), 'start_time' => '10:00:00', 'end_time' => '11:00:00', 'status' => 'available']); App\Models\TeacherSlot::create(['teacher_id' => \$t->id, 'slot_date' => now()->addDays(1)->format('Y-m-d'), 'start_time' => '12:00:00', 'end_time' => '13:00:00', 'status' => 'available']); App\Models\TeacherSlot::create(['teacher_id' => \$t->id, 'slot_date' => now()->addDays(2)->format('Y-m-d'), 'start_time' => '15:00:00', 'end_time' => '16:00:00', 'status' => 'available']); App\Models\TeacherSlot::create(['teacher_id' => \$t->id, 'slot_date' => now()->addDays(3)->format('Y-m-d'), 'start_time' => '18:00:00', 'end_time' => '19:00:00', 'status' => 'available']);"


http://localhost:8000/admin

docker-compose exec laravel.test php artisan make:filament-user

docker-compose exec laravel.test php artisan tinker

🧾 Test command used
docker-compose exec laravel.test php artisan test --filter BookingServiceUnitTest (passes)
docker-compose exec laravel.test php artisan test (all tests pass)

Backend Test:
docker-compose exec laravel.test php artisan test

docker-compose exec laravel.test php artisan test --filter BookingServiceUnitTest


Frontend Test:

