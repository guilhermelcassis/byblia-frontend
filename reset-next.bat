@echo off
echo Stopping any running Next.js processes...
taskkill /f /im node.exe

echo Removing .next folder...
if exist ".next" rmdir /s /q .next

echo Uninstalling Next.js...
call npm uninstall next

echo Installing Next.js 14.1.0...
call npm install next@14.1.0

echo Installation complete! 