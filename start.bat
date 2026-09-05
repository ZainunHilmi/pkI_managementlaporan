@echo off
echo ========================================
echo   Sparepart Management System
echo ========================================
echo.
cd /d D:\PKL\management_sparepart\backend
echo Starting server at: http://localhost:8000
echo.
php artisan serve
pause
