FROM php:8.3-cli

LABEL maintainer="Taj Platform"

ARG WWWUSER=1000
WORKDIR /var/www/html
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       curl ca-certificates zip unzip git supervisor sqlite3 \
       libzip-dev libicu-dev libonig-dev libxml2-dev zlib1g-dev \
    && docker-php-ext-configure zip \
    && docker-php-ext-install pdo_mysql mbstring xml zip intl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# إعداد الصلاحيات (Render يتطلب مرونة في اليوزر)
RUN groupadd --force -g $WWWUSER sail
RUN useradd -ms /bin/bash --no-user-group -g $WWWUSER -u 1337 sail

# نسخ ملفات المشروع (مهم جداً للإنتاج)
COPY . .
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/bin/ --filename=composer \
    && composer install --no-dev --optimize-autoloader

# 🟢 التعديل الجوهري: جعل المنفذ ديناميكياً ليتناسب مع Render
CMD php artisan optimize:clear && php artisan storage:link && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-80}
