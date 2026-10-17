@echo off
:loop
cls
echo ===================================================
echo   DANG THEO DOI THAY DOI VA TU DONG DONG BO GIT
echo ===================================================
echo Thoi gian kiem tra gan nhat: %time%

:: Cu sau 60 giay se ep chay chuoi lenh nay
git add .
git commit -m "Auto update: %date% %time%"
git push origin main

echo ---------------------------------------------------
echo Dang cho 60 giay de quet lan tiep theo...
timeout /t 60
goto loop
