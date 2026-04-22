@echo off
chcp 65001 >nul
title 离职人员动态跟踪系统 - 一键安装部署

:: 设置颜色
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          离职人员动态跟踪系统 - 一键安装部署              ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  此脚本将自动完成以下操作：                                ║
echo ║  1. 检查 Node.js 和 Git 环境                              ║
echo ║  2. 克隆项目代码                                          ║
echo ║  3. 安装项目依赖                                          ║
echo ║  4. 配置环境变量                                          ║
echo ║  5. 启动项目                                              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: 设置项目信息
set PROJECT_NAME=realtime-tracking
set PROJECT_REPO=https://github.com/hbq969/realtime-tracking.git
set INSTALL_DIR=%~dp0%PROJECT_NAME%

:: ============================================
:: 第一步：检查 Node.js
:: ============================================
echo [1/5] 检查 Node.js 环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    echo 建议下载 LTS 版本
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo       √ Node.js 版本: %NODE_VERSION%

:: 检查 Node.js 版本是否 >= 18
for /f "tokens=1,2 delims=v." %%a in ("%NODE_VERSION%") do (
    set NODE_MAJOR=%%a
)
if %NODE_MAJOR% lss 18 (
    echo.
    echo [警告] Node.js 版本过低，建议升级到 18.x 或更高版本
    echo 当前版本: %NODE_VERSION%
    echo.
    choice /c YN /m "是否继续安装？(Y/N)"
    if errorlevel 2 exit /b 1
)

:: ============================================
:: 第二步：检查 Git
:: ============================================
echo.
echo [2/5] 检查 Git 环境...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [错误] 未检测到 Git，请先安装 Git
    echo 下载地址: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
echo       √ %GIT_VERSION%

:: ============================================
:: 第三步：克隆项目
:: ============================================
echo.
echo [3/5] 克隆项目代码...

if exist "%INSTALL_DIR%" (
    echo       项目目录已存在: %INSTALL_DIR%
    choice /c YN /m "是否删除并重新克隆？(Y/N)"
    if errorlevel 1 (
        echo       正在删除旧目录...
        rmdir /s /q "%INSTALL_DIR%"
    ) else (
        echo       使用现有项目目录
        goto :INSTALL_DEPS
    )
)

echo       正在克隆项目到: %INSTALL_DIR%
git clone %PROJECT_REPO% "%INSTALL_DIR%"
if %errorlevel% neq 0 (
    echo.
    echo [错误] 克隆项目失败，请检查网络连接
    pause
    exit /b 1
)
echo       √ 项目克隆完成

:INSTALL_DEPS

:: 进入项目目录
cd /d "%INSTALL_DIR%"

:: ============================================
:: 第四步：安装依赖
:: ============================================
echo.
echo [4/5] 安装项目依赖...

:: 检查是否需要设置国内镜像
echo.
choice /c YN /m "是否使用国内镜像加速下载？(推荐) (Y/N)"
if errorlevel 1 (
    echo       正在设置 npm 镜像...
    npm config set registry https://registry.npmmirror.com
)

echo       正在安装依赖，请耐心等待...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [错误] 依赖安装失败
    echo 尝试清除缓存后重新安装...
    call npm cache clean --force
    rmdir /s /q node_modules 2>nul
    del package-lock.json 2>nul
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装仍然失败，请检查网络连接
        pause
        exit /b 1
    )
)
echo       √ 依赖安装完成

:: ============================================
:: 第五步：配置环境变量
:: ============================================
echo.
echo [5/5] 配置环境变量...

if exist ".env.local" (
    echo       .env.local 文件已存在
    choice /c YN /m "是否覆盖现有配置？(Y/N)"
    if errorlevel 2 goto :START_PROJECT
)

echo       正在创建 .env.local 文件...

(
echo # Supabase
echo NEXT_PUBLIC_SUPABASE_URL=https://efditfmtgprgcfiejvyx.supabase.co
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_yXd0iCPFdnovdP1mPJFWow_JmG2OrFP
echo SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZGl0Zm10Z3ByZ2NmaWVqdnl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc0MTk1MiwiZXhwIjoyMDkyMzE3OTUyfQ.vdR7xhqI3ytKgS4JCnQHVyRTXr2Z_kexBf8R5ypTeOU
echo.
echo # SMTP 邮件配置（可选）
echo SMTP_HOST=smtp.example.com
echo SMTP_PORT=465
echo SMTP_PASSWORD=your_password
echo.
echo # App
echo NEXT_PUBLIC_APP_URL=http://localhost:3000
) > .env.local

echo       √ 环境变量配置完成

:: ============================================
:: 启动项目
:: ============================================
:START_PROJECT
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    安装完成！                              ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  项目目录: %INSTALL_DIR%
echo ║                                                            ║
echo ║  启动命令:                                                 ║
echo ║    cd /d "%INSTALL_DIR%"                                  ║
echo ║    npm run dev                                            ║
echo ║                                                            ║
echo ║  访问地址: http://localhost:3000                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

choice /c YN /m "是否立即启动项目？(Y/N)"
if errorlevel 2 (
    echo.
    echo 安装完成！稍后可手动运行以下命令启动项目：
    echo   cd /d "%INSTALL_DIR%"
    echo   npm run dev
    echo.
    pause
    exit /b 0
)

echo.
echo 正在启动项目...
echo 请在浏览器中访问: http://localhost:3000
echo 按 Ctrl+C 可停止服务
echo.
echo ----------------------------------------------------------

call npm run dev

pause
