# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

离职人员动态跟踪系统 - HR离职员工回访跟踪与数据分析平台。

## 常用命令

```bash
npm run dev      # 启动开发服务器 (localhost:3000)
npm run build    # 生产构建
npm run start    # 启动生产服务器
npm run lint     # 运行 ESLint 检查
```

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **样式**: Tailwind CSS 4
- **UI组件**: shadcn/ui + Radix UI
- **后端服务**: Supabase (PostgreSQL + Auth + Storage)
- **图表**: Recharts
- **表单**: React Hook Form + Zod
- **报告导出**: @react-pdf/renderer + docx

## 架构结构

### 路由组织 (App Router)

使用路由组 (route groups) 组织页面：

- `app/(auth)/` - 认证相关页面 (登录)
- `app/(dashboard)/` - 主业务页面 (需登录)
- `app/api/` - API 路由
- `app/survey/[token]/` - 公开问卷页面 (令牌验证)

### 核心目录

```
app/
├── (auth)/          # 认证布局组
├── (dashboard)/     # 主业务布局组
├── api/             # API 路由
└── survey/          # 公开问卷页面

components/
├── ui/              # shadcn/ui 基础组件
├── layout/          # 布局组件 (Sidebar, Header)
├── employees/       # 员工管理组件
├── questionnaires/  # 问卷相关组件
├── follow-ups/      # 回访管理组件
├── analytics/       # 数据分析图表组件
└── reports/         # 报告相关组件

lib/
├── supabase/        # Supabase 客户端 (client/server/admin)
├── db/              # 数据库操作函数
├── actions/         # Server Actions
├── report/          # 报告生成 (PDF/Word)
└── email.ts         # 邮件发送

types/
└── database.ts      # Supabase 数据库类型定义
```

## 数据模型

主要表结构 (详见 `types/database.ts`):

- `employees` - 离职员工信息
- `questionnaires` - 问卷定义
- `survey_responses` - 问卷回答
- `follow_up_plans` - 回访计划
- `follow_up_records` - 回访记录
- `reports` - 生成的报告
- `survey_tokens` - 问卷访问令牌

## 开发规范

### Supabase 客户端使用

- **客户端组件**: 使用 `lib/supabase/client.ts` 的 `createSupabaseClient()`
- **服务端组件/Server Actions**: 使用 `lib/supabase/server.ts` 的 `createSupabaseServerClient()`
- **管理操作**: 使用 `lib/supabase/admin.ts`

### 数据库操作

数据库操作封装在 `lib/db/` 目录，避免直接在组件中编写 SQL。

### 组件规范

- 使用 shadcn/ui 组件，位于 `components/ui/`
- 新增 UI 组件使用 `npx shadcn@latest add <component>` 安装
- 业务组件按功能模块组织在 `components/` 对应目录

### 路径别名

使用 `@/*` 作为项目根目录别名 (已在 tsconfig.json 配置)。

## 环境变量

需要配置以下 Supabase 环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
