@echo off
echo Dang theo doi thay doi thu muc...

:loop
:: Buoc 1: Gom tat ca thay doi vao staging area
git add .

:: Buoc 2: Kiem tra xem co su thay doi nao so voi phien ban truoc khong
git diff --quiet HEAD
if errorlevel 1 (
    echo Co thay doi moi! Dang tu dong push len GitHub...
    git commit -m "Auto update"
    git push origin main
    echo Cap nhat thanh cong.
    echo -------------------------------------------
)

:: Buoc 3: Cho 60 giay truoc khi quet lai
timeout /t 60 >nul
goto loop
