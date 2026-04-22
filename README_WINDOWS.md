# Windows 本地安装使用指南

## 一、环境要求

| 软件 | 版本要求 | 下载地址 |
|------|----------|----------|
| Node.js | 18.x 或更高版本 | https://nodejs.org/ |
| Git | 最新版 | https://git-scm.com/download/win |

## 二、安装步骤

### 1. 安装 Node.js

1. 访问 https://nodejs.org/
2. 下载 **LTS（长期支持版）** 安装包
3. 双击安装包，一路点击「Next」完成安装
4. 打开 **命令提示符** 或 **PowerShell**，验证安装：
   ```cmd
   node -v
   npm -v
   ```
   显示版本号即安装成功

### 2. 安装 Git

1. 访问 https://git-scm.com/download/win
2. 下载并安装 Git
3. 安装完成后，右键菜单会出现「Git Bash Here」选项

### 3. 克隆项目

打开 **命令提示符** 或 **PowerShell**，执行：

```cmd
# 进入你想存放项目的目录
cd D:\

# 克隆项目
git clone https://github.com/hbq969/realtime-tracking.git

# 进入项目目录
cd realtime-tracking
```

### 4. 安装依赖

```cmd
npm install
```

> 如果下载速度慢，可以设置国内镜像：
> ```cmd
> npm config set registry https://registry.npmmirror.com
> npm install
> ```

### 5. 配置环境变量

1. 在项目根目录创建 `.env.local` 文件
2. 复制以下内容到文件中：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://efditfmtgprgcfiejvyx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_yXd0iCPFdnovdP1mPJFWow_JmG2OrFP
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZGl0Zm10Z3ByZ2NmaWVqdnl4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc0MTk1MiwiZXhwIjoyMDkyMzE3OTUyfQ.vdR7xhqI3ytKgS4JCnQHVyRTXr2Z_kexBf8R5ypTeOU

# SMTP 邮件配置（可选）
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_PASSWORD=你的授权码

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 三、运行项目

### 开发模式

```cmd
npm run dev
```

启动成功后，浏览器访问：http://localhost:3000

### 生产模式

```cmd
# 构建
npm run build

# 启动
npm run start
```

## 四、常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 代码检查 |

## 五、常见问题

### Q1: `npm install` 报错

**解决方案：**
```cmd
# 清除缓存
npm cache clean --force

# 删除 node_modules 重新安装
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Q2: 端口 3000 被占用

**解决方案：**
```cmd
# 查看占用端口的进程
netstat -ano | findstr :3000

# 结束进程（PID 为上一步查到的进程ID）
taskkill /PID <进程ID> /F
```

### Q3: 页面无法访问

1. 检查 `.env.local` 文件是否正确配置
2. 检查防火墙是否阻止了 Node.js
3. 尝试使用 `http://127.0.0.1:3000` 访问

### Q4: 登录后无反应

1. 清除浏览器缓存
2. 检查 Supabase 配置是否正确
3. 打开浏览器开发者工具（F12）查看控制台错误

## 六、项目结构

```
realtime-tracking/
├── app/                 # 页面路由
├── components/          # 组件
├── lib/                 # 工具库
├── types/               # 类型定义
├── public/              # 静态资源
├── .env.local           # 环境变量（需自行创建）
├── package.json         # 项目配置
└── README.md            # 项目说明
```

## 七、技术支持

- 项目地址：https://github.com/hbq969/realtime-tracking
- 问题反馈：在 GitHub Issues 中提交
