@echo off
chcp 65001 >nul
title 离职人员动态跟踪系统 - 启动

color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          离职人员动态跟踪系统 - 启动服务                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: 进入项目目录
cd /d "%~dp0"

:: 检查 node_modules 是否存在
if not exist "node_modules" (
    echo [提示] 检测到未安装依赖，正在安装...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

:: 检查 .env.local 是否存在
if not exist ".env.local" (
    echo [警告] 未找到 .env.local 配置文件
    echo 请先运行 install.bat 进行安装配置
    pause
    exit /b 1
)

echo 正在启动开发服务器...
echo 访问地址: http://localhost:3000
echo 按 Ctrl+C 可停止服务
echo.
echo ----------------------------------------------------------

call npm run dev

pause
