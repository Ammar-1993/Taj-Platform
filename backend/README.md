SA55 8000 0012 3456 7890 1234

docker-compose exec laravel.test php artisan migrate:fresh --seed

token:1|noTkwRH9THg5Xb2rPs4MEiXpg5mdx8hgrnvuq6vE3a886a53


الآن سجل دخولك بحساب الإدارة: admin@taj.com / password123.
سجل الدخول كمعلم (teacher@taj.com / password123).
سجل الدخول كطالب (student@taj.com / password123).
سجل الدخول كولي أمر (parent@taj.com / password123).
سيتم توجيهك لصفحة الدخول. الآن، سجل دخولك ببيانات الابن الجديد:
الإيميل: yasser@taj.com
الباسوورد: password123



docker-compose exec laravel.test php artisan optimize:clear

docker-compose exec laravel.test php artisan cache:clear


docker-compose exec laravel.test rm -rf public/storage
docker-compose exec laravel.test php artisan storage:link

docker-compose up -d
docker-compose stop


docker-compose exec laravel.test tail -n 20 storage/logs/laravel.log


docker-compose exec laravel.test php artisan tinker --execute="DB::statement('ALTER TABLE wallet_transactions MODIFY type VARCHAR(50)');"

اكتب في مربع كود الخصم: TAJ2026.

