FROM ubuntu:22.04

LABEL maintainer="Taj Platform"

ARG WWWUSER=1000
WORKDIR /var/www/html
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update \
    && apt-get install -y gnupg curl ca-certificates zip unzip git supervisor sqlite3 \
    && curl -sS 'https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x14aa40ec0831756756d7f66c4f4ea0aae5267a6c' | gpg --dearmor | tee /etc/apt/keyrings/ppa_ondrej_php.gpg > /dev/null \
    && echo "deb [signed-by=/etc/apt/keyrings/ppa_ondrej_php.gpg] https://ppa.launchpadcontent.net/ondrej/php/ubuntu jammy main" > /etc/apt/sources.list.d/ppa_ondrej_php.list \
    && apt-get update \
    && apt-get install -y php8.3-cli php8.3-dev \
       php8.3-mysql php8.3-mbstring php8.3-xml php8.3-zip php8.3-curl php8.3-intl \
    && curl -sLS https://getcomposer.org/installer | php -- --install-dir=/usr/bin/ --filename=composer \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# إعداد الصلاحيات (Render يتطلب مرونة في اليوزر)
RUN groupadd --force -g $WWWUSER sail
RUN useradd -ms /bin/bash --no-user-group -g $WWWUSER -u 1337 sail

# نسخ ملفات المشروع (مهم جداً للإنتاج)
COPY . .
RUN composer install --no-dev --optimize-autoloader

# 🟢 التعديل الجوهري: جعل المنفذ ديناميكياً ليتناسب مع Render
CMD php artisan optimize:clear && php artisan storage:link && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-80}