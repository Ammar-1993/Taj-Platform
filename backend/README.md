docker-compose exec laravel.test php artisan optimize:clear

docker-compose exec laravel.test php artisan cache:clear


docker-compose exec laravel.test rm -rf public/storage
docker-compose exec laravel.test php artisan storage:link