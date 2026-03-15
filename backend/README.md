token:1|noTkwRH9THg5Xb2rPs4MEiXpg5mdx8hgrnvuq6vE3a886a53



docker-compose exec laravel.test php artisan optimize:clear

docker-compose exec laravel.test php artisan cache:clear


docker-compose exec laravel.test rm -rf public/storage
docker-compose exec laravel.test php artisan storage:link

docker-compose up -d

