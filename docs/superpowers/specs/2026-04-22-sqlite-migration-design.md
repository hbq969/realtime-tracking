# Supabase 到 SQLite 迁移设计文档

## 背景

国内网络连接 Supabase 速度较慢，影响用户体验。本设计将 Supabase 数据库迁移到本地嵌入式 SQLite 数据库，实现零外部依赖的单机部署方案。

## 设计目标

1. **零外部依赖** - 无需网络连接即可运行
2. **轻量级** - SQLite 单文件数据库，开箱即用
3. **简单认证** - 简单密码保护，无需复杂的用户管理系统
4. **本地文件存储** - 二维码、报告等文件存储在本地文件系统

## 技术选型

| 组件 | 原方案 | 新方案 |
|------|--------|--------|
| 数据库 | Supabase (PostgreSQL) | SQLite + better-sqlite3 |
| 认证 | Supabase Auth | 简单密码 + Cookie Session |
| 文件存储 | Supabase Storage | 本地文件系统 |

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Application                   │
├─────────────────────────────────────────────────────────┤
│  lib/db/           数据访问层 (SQLite)                    │
│  lib/auth/         认证层 (简单密码保护)                   │
│  lib/storage/      文件存储层 (本地文件系统)               │
├─────────────────────────────────────────────────────────┤
│  data/             SQLite 数据库文件                      │
│  uploads/          上传文件存储                           │
└─────────────────────────────────────────────────────────┘
```

## 数据库设计

### 数据库文件

- 位置: `data/realtime-tracking.db`
- 模式: WAL (Write-Ahead Logging) 提升并发性能

### 表结构

```sql
-- 员工表
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  department TEXT,
  team TEXT,
  position TEXT,
  leave_date TEXT,
  leave_reason TEXT,
  employment_duration INTEGER,
  reporter_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 问卷表
CREATE TABLE questionnaires (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  questions TEXT,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  external_url TEXT,
  external_type TEXT,
  email_subject TEXT,
  email_body TEXT
);

-- 问卷令牌表
CREATE TABLE survey_tokens (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  employee_id TEXT,
  questionnaire_id TEXT,
  used INTEGER DEFAULT 0,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 问卷回答表
CREATE TABLE survey_responses (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  questionnaire_id TEXT,
  answers TEXT,
  submit_channel TEXT DEFAULT 'survey',
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 回访计划表
CREATE TABLE follow_up_plans (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  plan_date TEXT,
  follow_up_type TEXT,
  status TEXT DEFAULT 'pending',
  reminder_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 回访记录表
CREATE TABLE follow_up_records (
  id TEXT PRIMARY KEY,
  plan_id TEXT,
  employee_id TEXT,
  contact_method TEXT,
  contact_result TEXT,
  new_company TEXT,
  new_position TEXT,
  salary_change TEXT,
  personal_feeling TEXT,
  suggestions TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 报告表
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT,
  filters TEXT,
  content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_survey_tokens_token ON survey_tokens(token);
CREATE INDEX idx_follow_up_plans_status ON follow_up_plans(status);
CREATE INDEX idx_follow_up_plans_employee ON follow_up_plans(employee_id);
CREATE INDEX idx_follow_up_records_employee ON follow_up_records(employee_id);
CREATE INDEX idx_survey_responses_employee ON survey_responses(employee_id);
```

## 认证设计

### 配置

通过环境变量配置管理员账户:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

### 认证流程

1. 用户提交用户名和密码
2. 服务端验证凭据
3. 生成随机 session token，存入 cookie
4. 后续请求通过 middleware 验证 cookie

### Session 配置

- Cookie 名称: `session`
- 有效期: 24 小时
- HttpOnly: 是
- Secure: 生产环境启用

## 文件存储设计

### 目录结构

```
uploads/
├── qrcodes/      # 问卷二维码图片 (PNG)
├── reports/      # 导出的报告文件 (PDF, DOCX)
└── imports/      # 导入的临时文件
```

### API

```typescript
// 保存文件
saveFile(category: string, filename: string, data: Buffer): Promise<string>

// 读取文件
readFile(category: string, filename: string): Promise<Buffer>

// 删除文件
deleteFile(category: string, filename: string): Promise<void>

// 列出文件
listFiles(category: string): Promise<string[]>
```

## 文件修改清单

### 删除的文件

| 文件 | 说明 |
|------|------|
| `lib/supabase/client.ts` | Supabase 客户端 |
| `lib/supabase/server.ts` | Supabase 服务端客户端 |
| `lib/supabase/admin.ts` | Supabase 管理客户端 |
| `app/api/auth/callback/route.ts` | Supabase 认证回调 |
| `types/database.ts` | Supabase 类型定义 |

### 新增的文件

| 文件 | 说明 |
|------|------|
| `lib/db/index.ts` | SQLite 初始化和连接 |
| `lib/db/schema.ts` | 数据库表结构定义 |
| `lib/auth/index.ts` | 认证模块 |
| `lib/auth/config.ts` | 认证配置 |
| `lib/storage/index.ts` | 文件存储模块 |
| `types/db.ts` | SQLite 类型定义 |

### 修改的文件

| 文件 | 修改内容 |
|------|----------|
| `lib/db/employees.ts` | 重写为 SQLite 实现 |
| `lib/db/questionnaires.ts` | 重写为 SQLite 实现 |
| `lib/db/follow-ups.ts` | 重写为 SQLite 实现 |
| `lib/db/reports.ts` | 重写为 SQLite 实现 |
| `middleware.ts` | 改用本地认证验证 |
| `app/(auth)/login/page.tsx` | 改用本地认证 API |
| `lib/email.ts` | 二维码存储改用本地文件系统 |
| `lib/qrcode.ts` | 二维码生成改用本地存储 |
| `package.json` | 更新依赖 |

## 依赖变更

### 新增依赖

```json
{
  "better-sqlite3": "^11.0.0",
  "@types/better-sqlite3": "^7.6.11"
}
```

### 移除依赖

```json
{
  "@supabase/ssr": "^0.10.2",
  "@supabase/supabase-js": "^2.104.0"
}
```

## 环境变量变更

### 移除

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 新增

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

## 迁移步骤

1. 安装 better-sqlite3 依赖
2. 创建 SQLite 数据库初始化模块
3. 重写数据访问层 (lib/db/*.ts)
4. 实现本地认证模块
5. 实现本地文件存储模块
6. 修改 middleware 使用本地认证
7. 修改登录页面使用本地认证
8. 更新相关组件和 API 路由
9. 移除 Supabase 相关代码和依赖
10. 测试验证所有功能

## 风险与注意事项

1. **数据丢失**: 迁移后原有 Supabase 数据无法访问，需确认不需要迁移
2. **并发限制**: SQLite 写操作有并发限制，但对于单机小规模应用足够
3. **备份**: 需要定期备份 `data/` 目录下的数据库文件
4. **密码安全**: 建议通过环境变量设置强密码，不要使用默认密码

## 成功标准

1. 应用启动无需网络连接
2. 所有 CRUD 操作正常工作
3. 认证功能正常
4. 文件上传/下载正常
5. 报告生成和导出正常
