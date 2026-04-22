@echo off
chcp 65001 >nul
title 离职人员动态跟踪系统 - 卸载

color 0C

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          离职人员动态跟踪系统 - 卸载                      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo 此操作将删除以下内容：
echo   - node_modules 文件夹
echo   - .next 文件夹
echo   - package-lock.json 文件
echo   - .env.local 配置文件
echo.

choice /c YN /m "确定要卸载吗？(Y/N)"
if errorlevel 2 (
    echo 已取消卸载
    pause
    exit /b 0
)

echo.
echo 正在清理...

if exist "node_modules" (
    echo   删除 node_modules...
    rmdir /s /q node_modules
)

if exist ".next" (
    echo   删除 .next...
    rmdir /s /q .next
)

if exist "package-lock.json" (
    echo   删除 package-lock.json...
    del package-lock.json
)

if exist ".env.local" (
    echo   删除 .env.local...
    del .env.local
)

echo.
echo √ 卸载完成！
echo.
pause
