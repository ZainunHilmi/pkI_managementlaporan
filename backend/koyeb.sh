#!/bin/bash
set -e
composer install --no-dev --optimize-autoloader
php artisan key:generate --force
php artisan config:cache
php artisan route:cache
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link