@echo off
cd /d "%~dp0"
echo ========================================================
echo   Pushing CalHabit to GitHub...
echo ========================================================
echo.
git add .
git commit -m "update: latest changes"
echo.
git push -u origin main
echo.
echo ========================================================
echo  All done! If you see any browser popup, please log in.
echo ========================================================
pause
