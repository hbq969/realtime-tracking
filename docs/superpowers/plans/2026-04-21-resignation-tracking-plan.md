# 离职人员动态跟踪系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的离职人员动态跟踪Web应用，支持回访管理、数据分析、报告生成。

**Architecture:** Next.js 14 App Router 全栈应用，使用 Supabase 作为后端服务（数据库+认证+存储），shadcn/ui 作为UI组件库，Recharts 作为图表库。

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Recharts, React Hook Form, Zod, @react-pdf/renderer, docx

---

## 文件结构

```
/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证相关页面组
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # 需登录的页面组
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   ├── add/
│   │   │   │   └── page.tsx
│   │   │   ├── import/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── questionnaires/
│   │   │   ├── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── follow-ups/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── analytics/
│   │   │   ├── page.tsx
│   │   │   ├── trends/
│   │   │   │   └── page.tsx
│   │   │   └── insights/
│   │   │       └── page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   ├── generate/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   └── oauth/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── survey/
│   │   └── [token]/
│   │       └── page.tsx
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── employees/
│   │   │   └── route.ts
│   │   ├── questionnaires/
│   │   │   └── route.ts
│   │   ├── follow-ups/
│   │   │   └── route.ts
│   │   ├── analytics/
│   │   │   └── route.ts
│   │   └── reports/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # React组件
│   ├── ui/                       # shadcn/ui组件
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── nav.tsx
│   ├── employees/
│   │   ├── employee-form.tsx
│   │   ├── employee-list.tsx
│   │   └── employee-import.tsx
│   ├── questionnaires/
│   │   ├── questionnaire-form.tsx
│   │   ├── question-editor.tsx
│   │   └── questionnaire-preview.tsx
│   ├── follow-ups/
│   │   ├── follow-up-form.tsx
│   │   └── follow-up-list.tsx
│   ├── analytics/
│   │   ├── pie-chart.tsx
│   │   ├── line-chart.tsx
│   │   └── bar-chart.tsx
│   └── reports/
│       ├── report-preview.tsx
│       └── report-export.tsx
├── lib/                          # 工具库
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── auth/
│   │   ├── index.ts
│   │   └── middleware.ts
│   ├── db/
│   │   ├── employees.ts
│   │   ├── questionnaires.ts
│   │   ├── follow-ups.ts
│   │   └── reports.ts
│   ├── report/
│   │   ├── pdf.ts
│   │   └── word.ts
│   └── utils.ts
├── types/                        # TypeScript类型
│   ├── employee.ts
│   ├── questionnaire.ts
│   ├── follow-up.ts
│   └── report.ts
├── hooks/                        # React Hooks
│   ├── use-employees.ts
│   ├── use-questionnaires.ts
│   └── use-follow-ups.ts
├── supabase/                     # Supabase配置
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── config.toml
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── components.json
└── package.json
```

---

## Phase 1: 项目初始化与基础框架

### Task 1: Next.js 项目初始化

**Files:**
- Create: `package.json`
- Create: `next.config.js`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `.env.local`
- Create: `.gitignore`

- [ ] **Step 1: 创建 Next.js 项目**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-git
```

- [ ] **Step 2: 安装核心依赖**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast
npm install react-hook-form zod @hookform/resolvers
npm install recharts
npm install @react-pdf/renderer docx
npm install date-fns
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge
```

- [ ] **Step 3: 创建 .env.local 文件**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 4: 创建 .gitignore 文件**

```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 5: 提交初始化代码**

```bash
git add .
git commit -m "chore: 初始化 Next.js 项目和依赖

- Next.js 14 with App Router
- TypeScript + Tailwind CSS
- Supabase client libraries
- shadcn/ui dependencies
- Recharts for charts
- React Hook Form + Zod for forms"
```

---

### Task 2: shadcn/ui 配置与基础组件安装

**Files:**
- Create: `components.json`
- Create: `lib/utils.ts`
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/table.tsx`
- Create: `components/ui/dialog.tsx`
- Create: `components/ui/select.tsx`
- Create: `components/ui/tabs.tsx`
- Create: `components/ui/toast.tsx`
- Create: `components/ui/form.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/dropdown-menu.tsx`
- Create: `components/ui/skeleton.tsx`

- [ ] **Step 1: 初始化 shadcn/ui**

```bash
npx shadcn@latest init -d
```

- [ ] **Step 2: 安装常用组件**

```bash
npx shadcn@latest add button input card table dialog select tabs toast form badge dropdown-menu skeleton separator label textarea checkbox radio-group calendar popover command
```

- [ ] **Step 3: 提交 shadcn/ui 配置**

```bash
git add .
git commit -m "feat: 配置 shadcn/ui 并安装基础组件"
```

---

### Task 3: Supabase 客户端配置

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/admin.ts`
- Create: `types/database.ts`

- [ ] **Step 1: 创建 Supabase 浏览器客户端**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: 创建 Supabase 服务端客户端**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component中调用时可能失败，可忽略
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: 创建 Supabase Admin 客户端**

```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export function createSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

- [ ] **Step 4: 创建数据库类型定义**

```typescript
// types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          name: string
          phone: string
          email: string
          department: string
          position: string
          leave_date: string
          leave_reason: string
          employment_duration: number
          reporter_id: string | null
          status: 'pending' | 'followed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email: string
          department: string
          position: string
          leave_date: string
          leave_reason: string
          employment_duration: number
          reporter_id?: string | null
          status?: 'pending' | 'followed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string
          department?: string
          position?: string
          leave_date?: string
          leave_reason?: string
          employment_duration?: number
          reporter_id?: string | null
          status?: 'pending' | 'followed'
          created_at?: string
          updated_at?: string
        }
      }
      questionnaires: {
        Row: {
          id: string
          title: string
          description: string
          questions: Json
          status: 'draft' | 'active' | 'archived'
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          questions: Json
          status?: 'draft' | 'active' | 'archived'
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          questions?: Json
          status?: 'draft' | 'active' | 'archived'
          created_at?: string
        }
      }
      survey_responses: {
        Row: {
          id: string
          employee_id: string
          questionnaire_id: string
          answers: Json
          submit_channel: 'survey' | 'manual'
          submitted_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          questionnaire_id: string
          answers: Json
          submit_channel: 'survey' | 'manual'
          submitted_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          questionnaire_id?: string
          answers?: Json
          submit_channel?: 'survey' | 'manual'
          submitted_at?: string
        }
      }
      follow_up_plans: {
        Row: {
          id: string
          employee_id: string
          plan_date: string
          follow_up_type: '1m' | '3m' | '6m' | 'custom'
          status: 'pending' | 'completed' | 'overdue'
          reminder_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          plan_date: string
          follow_up_type: '1m' | '3m' | '6m' | 'custom'
          status?: 'pending' | 'completed' | 'overdue'
          reminder_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          plan_date?: string
          follow_up_type?: '1m' | '3m' | '6m' | 'custom'
          status?: 'pending' | 'completed' | 'overdue'
          reminder_sent?: boolean
          created_at?: string
        }
      }
      follow_up_records: {
        Row: {
          id: string
          plan_id: string
          employee_id: string
          contact_method: 'phone' | 'wechat' | 'email'
          contact_result: 'connected' | 'no_answer' | 'refused'
          new_company: string
          new_position: string
          salary_change: 'increase' | 'decrease' | 'same'
          personal_feeling: string
          suggestions: string
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          employee_id: string
          contact_method: 'phone' | 'wechat' | 'email'
          contact_result: 'connected' | 'no_answer' | 'refused'
          new_company: string
          new_position: string
          salary_change: 'increase' | 'decrease' | 'same'
          personal_feeling: string
          suggestions: string
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          employee_id?: string
          contact_method?: 'phone' | 'wechat' | 'email'
          contact_result?: 'connected' | 'no_answer' | 'refused'
          new_company?: string
          new_position?: string
          salary_change?: 'increase' | 'decrease' | 'same'
          personal_feeling?: string
          suggestions?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          title: string
          type: string
          filters: Json
          content: Json
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          type: string
          filters: Json
          content: Json
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          type?: string
          filters?: Json
          content?: Json
          created_at?: string
        }
      }
      survey_tokens: {
        Row: {
          id: string
          token: string
          employee_id: string
          questionnaire_id: string
          used: boolean
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          token: string
          employee_id: string
          questionnaire_id: string
          used?: boolean
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          employee_id?: string
          questionnaire_id?: string
          used?: boolean
          expires_at?: string
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
```

- [ ] **Step 5: 提交 Supabase 配置**

```bash
git add .
git commit -m "feat: 配置 Supabase 客户端和数据库类型定义"
```

---

### Task 4: Supabase 数据库迁移脚本

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: 创建数据库初始化迁移脚本**

```sql
-- supabase/migrations/001_initial_schema.sql

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 离职员工表
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  leave_date DATE NOT NULL,
  leave_reason TEXT NOT NULL,
  employment_duration INTEGER NOT NULL,
  reporter_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'followed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 问卷表
CREATE TABLE IF NOT EXISTS public.questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 问卷令牌表（用于生成一次性问卷链接）
CREATE TABLE IF NOT EXISTS public.survey_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 问卷回答表
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]',
  submit_channel TEXT NOT NULL CHECK (submit_channel IN ('survey', 'manual')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 回访计划表
CREATE TABLE IF NOT EXISTS public.follow_up_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  follow_up_type TEXT NOT NULL CHECK (follow_up_type IN ('1m', '3m', '6m', 'custom')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 回访记录表
CREATE TABLE IF NOT EXISTS public.follow_up_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.follow_up_plans(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  contact_method TEXT NOT NULL CHECK (contact_method IN ('phone', 'wechat', 'email')),
  contact_result TEXT NOT NULL CHECK (contact_result IN ('connected', 'no_answer', 'refused')),
  new_company TEXT,
  new_position TEXT,
  salary_change TEXT CHECK (salary_change IN ('increase', 'decrease', 'same')),
  personal_feeling TEXT,
  suggestions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 报告表
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_leave_date ON public.employees(leave_date);
CREATE INDEX idx_employees_department ON public.employees(department);
CREATE INDEX idx_follow_up_plans_status ON public.follow_up_plans(status);
CREATE INDEX idx_follow_up_plans_plan_date ON public.follow_up_plans(plan_date);
CREATE INDEX idx_survey_tokens_token ON public.survey_tokens(token);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 employees 表添加更新时间触发器
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 设置 RLS (Row Level Security)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS 策略：允许认证用户访问所有数据
CREATE POLICY "Allow authenticated users to access employees"
  ON public.employees FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to access questionnaires"
  ON public.questionnaires FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to access survey_responses"
  ON public.survey_responses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to access follow_up_plans"
  ON public.follow_up_plans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to access follow_up_records"
  ON public.follow_up_records FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to access reports"
  ON public.reports FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 问卷令牌：匿名用户可以查看和更新（用于填写问卷）
CREATE POLICY "Allow anonymous to select survey_tokens"
  ON public.survey_tokens FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous to update survey_tokens"
  ON public.survey_tokens FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- 允许匿名用户插入问卷回答
CREATE POLICY "Allow anonymous to insert survey_responses"
  ON public.survey_responses FOR INSERT
  TO anon
  WITH CHECK (true);
```

- [ ] **Step 2: 提交迁移脚本**

```bash
git add .
git commit -m "feat: 添加 Supabase 数据库初始化迁移脚本"
```

---

### Task 5: 类型定义

**Files:**
- Create: `types/employee.ts`
- Create: `types/questionnaire.ts`
- Create: `types/follow-up.ts`
- Create: `types/report.ts`

- [ ] **Step 1: 创建员工类型定义**

```typescript
// types/employee.ts
export interface Employee {
  id: string
  name: string
  phone: string
  email: string
  department: string
  position: string
  leave_date: string
  leave_reason: string
  employment_duration: number
  reporter_id: string | null
  status: 'pending' | 'followed'
  created_at: string
  updated_at: string
}

export interface EmployeeFormData {
  name: string
  phone: string
  email: string
  department: string
  position: string
  leave_date: string
  leave_reason: string
  employment_duration: number
}

export const LEAVE_REASONS = [
  '个人发展',
  '薪资待遇',
  '工作环境',
  '家庭原因',
  '健康原因',
  '继续深造',
  '创业',
  '其他',
] as const

export const DEPARTMENTS = [
  '技术部',
  '产品部',
  '运营部',
  '市场部',
  '人力资源部',
  '财务部',
  '行政部',
  '其他',
] as const
```

- [ ] **Step 2: 创建问卷类型定义**

```typescript
// types/questionnaire.ts
export type QuestionType = 'single' | 'multiple' | 'text' | 'rating'

export interface Question {
  id: string
  type: QuestionType
  title: string
  required: boolean
  options?: string[]
  placeholder?: string
}

export interface Questionnaire {
  id: string
  title: string
  description: string
  questions: Question[]
  status: 'draft' | 'active' | 'archived'
  created_at: string
}

export interface QuestionnaireFormData {
  title: string
  description: string
  questions: Question[]
}

export interface SurveyToken {
  id: string
  token: string
  employee_id: string
  questionnaire_id: string
  used: boolean
  expires_at: string
  created_at: string
}

export interface SurveyResponse {
  id: string
  employee_id: string
  questionnaire_id: string
  answers: Record<string, string | string[]>
  submit_channel: 'survey' | 'manual'
  submitted_at: string
}
```

- [ ] **Step 3: 创建回访类型定义**

```typescript
// types/follow-up.ts
export interface FollowUpPlan {
  id: string
  employee_id: string
  plan_date: string
  follow_up_type: '1m' | '3m' | '6m' | 'custom'
  status: 'pending' | 'completed' | 'overdue'
  reminder_sent: boolean
  created_at: string
  employee?: {
    name: string
    phone: string
    department: string
  }
}

export interface FollowUpRecord {
  id: string
  plan_id: string
  employee_id: string
  contact_method: 'phone' | 'wechat' | 'email'
  contact_result: 'connected' | 'no_answer' | 'refused'
  new_company: string
  new_position: string
  salary_change: 'increase' | 'decrease' | 'same'
  personal_feeling: string
  suggestions: string
  created_at: string
}

export interface FollowUpRecordFormData {
  contact_method: 'phone' | 'wechat' | 'email'
  contact_result: 'connected' | 'no_answer' | 'refused'
  new_company: string
  new_position: string
  salary_change: 'increase' | 'decrease' | 'same'
  personal_feeling: string
  suggestions: string
}

export const FOLLOW_UP_TYPES = [
  { value: '1m', label: '离职后1个月' },
  { value: '3m', label: '离职后3个月' },
  { value: '6m', label: '离职后6个月' },
  { value: 'custom', label: '自定义' },
] as const

export const CONTACT_METHODS = [
  { value: 'phone', label: '电话' },
  { value: 'wechat', label: '微信' },
  { value: 'email', label: '邮件' },
] as const

export const CONTACT_RESULTS = [
  { value: 'connected', label: '已联系' },
  { value: 'no_answer', label: '未接通' },
  { value: 'refused', label: '拒绝回答' },
] as const

export const SALARY_CHANGES = [
  { value: 'increase', label: '涨薪' },
  { value: 'decrease', label: '降薪' },
  { value: 'same', label: '持平' },
] as const
```

- [ ] **Step 4: 创建报告类型定义**

```typescript
// types/report.ts
export interface Report {
  id: string
  title: string
  type: string
  filters: Record<string, unknown>
  content: Record<string, unknown>
  created_at: string
}

export interface ReportFilters {
  date_from?: string
  date_to?: string
  departments?: string[]
  leave_reasons?: string[]
}

export interface ReportContent {
  summary: {
    total_employees: number
    follow_up_rate: number
    survey_response_rate: number
  }
  leave_reasons: Record<string, number>
  salary_changes: Record<string, number>
  new_companies: Array<{ name: string; count: number }>
  suggestions: string[]
}

export const REPORT_TYPES = [
  { value: 'summary', label: '综合报告' },
  { value: 'leave_analysis', label: '离职原因分析' },
  { value: 'follow_up', label: '回访情况报告' },
  { value: 'retention', label: '员工保有建议' },
] as const
```

- [ ] **Step 5: 提交类型定义**

```bash
git add .
git commit -m "feat: 添加核心业务类型定义"
```

---

### Task 6: 认证中间件与布局

**Files:**
- Create: `middleware.ts`
- Create: `app/layout.tsx`
- Create: `app/(auth)/layout.tsx`
- Create: `app/(dashboard)/layout.tsx`
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/header.tsx`
- Create: `components/layout/nav.tsx`

- [ ] **Step 1: 创建认证中间件**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 公开路径
  const publicPaths = ['/login', '/survey']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: 创建根布局**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '离职人员动态跟踪系统',
  description: 'HR离职员工回访跟踪与数据分析平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: 创建认证页面布局**

```typescript
// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      {children}
    </div>
  )
}
```

- [ ] **Step 4: 创建侧边栏组件**

```typescript
// components/layout/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  BarChart3,
  FileBarChart,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { href: '/employees', label: '离职员工', icon: Users },
  { href: '/questionnaires', label: '问卷管理', icon: FileText },
  { href: '/follow-ups', label: '回访管理', icon: Calendar },
  { href: '/analytics', label: '数据分析', icon: BarChart3 },
  { href: '/reports', label: '报告中心', icon: FileBarChart },
  { href: '/settings', label: '系统设置', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-white h-screen sticky top-0">
      <div className="p-6 border-b">
        <h1 className="text-xl font-semibold text-slate-900">离职跟踪系统</h1>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 5: 创建头部组件**

```typescript
// components/layout/header.tsx
'use client'

import { Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
      <div className="text-sm text-slate-500">
        {new Date().toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>个人设置</DropdownMenuItem>
            <DropdownMenuItem>退出登录</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

- [ ] **Step 6: 创建仪表盘布局**

```typescript
// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: 提交布局组件**

```bash
git add .
git commit -m "feat: 添加认证中间件和布局组件"
```

---

### Task 7: 登录页面

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/api/auth/callback/route.ts`

- [ ] **Step 1: 创建登录页面**

```typescript
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">登录</CardTitle>
        <CardDescription>离职人员动态跟踪系统</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: 创建认证回调路由**

```typescript
// app/api/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Component中调用时可能失败
            }
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

- [ ] **Step 3: 提交登录页面**

```bash
git add .
git commit -m "feat: 添加登录页面和认证回调"
```

---

## Phase 2: 核心业务功能

### Task 8: 数据库操作服务层

**Files:**
- Create: `lib/db/employees.ts`
- Create: `lib/db/questionnaires.ts`
- Create: `lib/db/follow-ups.ts`
- Create: `lib/db/reports.ts`

- [ ] **Step 1: 创建员工数据服务**

```typescript
// lib/db/employees.ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Employee, EmployeeFormData } from '@/types/employee'

export async function getEmployees(filters?: {
  department?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}) {
  const supabase = await createSupabaseServerClient()
  
  let query = supabase
    .from('employees')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters?.department) {
    query = query.eq('department', filters.department)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.dateFrom) {
    query = query.gte('leave_date', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('leave_date', filters.dateTo)
  }
  if (filters?.page && filters?.pageSize) {
    const from = (filters.page - 1) * filters.pageSize
    const to = from + filters.pageSize - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query

  if (error) throw error

  return { data: data as Employee[], count: count || 0 }
}

export async function getEmployeeById(id: string) {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return data as Employee
}

export async function createEmployee(formData: EmployeeFormData) {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('employees')
    .insert(formData)
    .select()
    .single()

  if (error) throw error

  return data as Employee
}

export async function updateEmployee(id: string, formData: Partial<EmployeeFormData>) {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('employees')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data as Employee
}

export async function deleteEmployee(id: string) {
  const supabase = await createSupabaseServerClient()
  
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function importEmployees(employees: EmployeeFormData[]) {
  const supabase = createSupabaseAdminClient()
  
  const { data, error } = await supabase
    .from('employees')
    .insert(employees)
    .select()

  if (error) throw error

  return data as Employee[]
}

export async function getEmployeeStats() {
  const supabase = await createSupabaseServerClient()
  
  const { count: total } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })

  const { count: pending } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { data: leaveReasons } = await supabase
    .from('employees')
    .select('leave_reason')

  const reasonsCount = leaveReasons?.reduce((acc, item) => {
    acc[item.leave_reason] = (acc[item.leave_reason] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    total: total || 0,
    pending: pending || 0,
    followed: (total || 0) - (pending || 0),
    leaveReasons: reasonsCount || {},
  }
}
```

- [ ] **Step 2: 创建问卷数据服务**

```typescript
// lib/db/questionnaires.ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Questionnaire, Question, SurveyToken, SurveyResponse } from '@/types/questionnaire'

export async function getQuestionnaires() {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('questionnaires')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data as Questionnaire[]
}

export async function getQuestionnaireById(id: string) {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return data as Questionnaire
}

export async function createQuestionnaire(formData: {
  title: string
  description: string
  questions: Question[]
}) {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('questionnaires')
    .insert({
      ...formData,
      questions: formData.questions as unknown as Record<string, unknown>,
    })
    .select()
    .single()

  if (error) throw error

  return data as Questionnaire
}

export async function updateQuestionnaire(
  id: string,
  formData: Partial<{
    title: string
    description: string
    questions: Question[]
    status: 'draft' | 'active' | 'archived'
  }>
) {
  const supabase = await createSupabaseServerClient()
  
  const updateData = { ...formData }
  if (formData.questions) {
    updateData.questions = formData.questions as unknown as Record<string, unknown>
  }
  
  const { data, error } = await supabase
    .from('questionnaires')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data as Questionnaire
}

export async function generateSurveyToken(employeeId: string, questionnaireId: string) {
  const supabase = createSupabaseAdminClient()
  
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7天后过期
  
  const { data, error } = await supabase
    .from('survey_tokens')
    .insert({
      token,
      employee_id: employeeId,
      questionnaire_id: questionnaireId,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  return data as SurveyToken
}

export async function validateSurveyToken(token: string) {
  const supabase = createSupabaseAdminClient()
  
  const { data, error } = await supabase
    .from('survey_tokens')
    .select('*, employees(*), questionnaires(*)')
    .eq('token', token)
    .single()

  if (error) throw error

  const tokenData = data as SurveyToken & {
    employees: Record<string, unknown>
    questionnaires: Record<string, unknown>
  }

  if (tokenData.used) {
    throw new Error('该问卷链接已使用')
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    throw new Error('该问卷链接已过期')
  }

  return tokenData
}

export async function submitSurveyResponse(
  token: string,
  answers: Record<string, string | string[]>
) {
  const supabase = createSupabaseAdminClient()
  
  const tokenData = await validateSurveyToken(token)
  
  const { error: responseError } = await supabase
    .from('survey_responses')
    .insert({
      employee_id: tokenData.employee_id,
      questionnaire_id: tokenData.questionnaire_id,
      answers: answers as unknown as Record<string, unknown>,
      submit_channel: 'survey',
    })

  if (responseError) throw responseError

  const { error: tokenError } = await supabase
    .from('survey_tokens')
    .update({ used: true })
    .eq('token', token)

  if (tokenError) throw tokenError
}

export async function getSurveyResponseRate() {
  const supabase = await createSupabaseServerClient()
  
  const { count: totalTokens } = await supabase
    .from('survey_tokens')
    .select('*', { count: 'exact', head: true })

  const { count: usedTokens } = await supabase
    .from('survey_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('used', true)

  return {
    total: totalTokens || 0,
    responded: usedTokens || 0,
    rate: totalTokens ? (usedTokens || 0) / totalTokens : 0,
  }
}
```

- [ ] **Step 3: 创建回访数据服务**

```typescript
// lib/db/follow-ups.ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { FollowUpPlan, FollowUpRecord, FollowUpRecordFormData } from '@/types/follow-up'

export async function getFollowUpPlans(filters?: {
  status?: string
  page?: number
  pageSize?: number
}) {
  const supabase = await createSupabaseServerClient()
  
  let query = supabase
    .from('follow_up_plans')
    .select(`
      *,
      employees(name, phone, department)
    `, { count: 'exact' })
    .order('plan_date', { ascending: true })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.page && filters?.pageSize) {
    const from = (filters.page - 1) * filters.pageSize
    const to = from + filters.pageSize - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query

  if (error) throw error

  return { data: data as FollowUpPlan[], count: count || 0 }
}

export async function getFollowUpPlanById(id: string) {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('follow_up_plans')
    .select(`
      *,
      employees(*),
      follow_up_records(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  return data
}

export async function createFollowUpPlan(formData: {
  employee_id: string
  plan_date: string
  follow_up_type: '1m' | '3m' | '6m' | 'custom'
}) {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('follow_up_plans')
    .insert(formData)
    .select()
    .single()

  if (error) throw error

  return data as FollowUpPlan
}

export async function createFollowUpRecord(
  planId: string,
  employeeId: string,
  formData: FollowUpRecordFormData
) {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('follow_up_records')
    .insert({
      plan_id: planId,
      employee_id: employeeId,
      ...formData,
    })
    .select()
    .single()

  if (error) throw error

  // 更新计划状态
  await supabase
    .from('follow_up_plans')
    .update({ status: 'completed' })
    .eq('id', planId)

  // 更新员工状态
  await supabase
    .from('employees')
    .update({ status: 'followed' })
    .eq('id', employeeId)

  return data as FollowUpRecord
}

export async function getUpcomingFollowUps(days: number = 7) {
  const supabase = await createSupabaseServerClient()
  
  const today = new Date()
  const endDate = new Date()
  endDate.setDate(today.getDate() + days)
  
  const { data, error } = await supabase
    .from('follow_up_plans')
    .select(`
      *,
      employees(name, phone, department)
    `)
    .eq('status', 'pending')
    .gte('plan_date', today.toISOString().split('T')[0])
    .lte('plan_date', endDate.toISOString().split('T')[0])
    .order('plan_date', { ascending: true })

  if (error) throw error

  return data as FollowUpPlan[]
}

export async function getFollowUpStats() {
  const supabase = await createSupabaseServerClient()
  
  const { count: total } = await supabase
    .from('follow_up_plans')
    .select('*', { count: 'exact', head: true })

  const { count: completed } = await supabase
    .from('follow_up_plans')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')

  const { count: pending } = await supabase
    .from('follow_up_plans')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return {
    total: total || 0,
    completed: completed || 0,
    pending: pending || 0,
    rate: total ? (completed || 0) / total : 0,
  }
}

export async function createDefaultFollowUpPlans(employeeId: string, leaveDate: string) {
  const supabase = await createSupabaseServerClient()
  
  const plans = [
    { type: '1m' as const, months: 1 },
    { type: '3m' as const, months: 3 },
    { type: '6m' as const, months: 6 },
  ]
  
  const leave = new Date(leaveDate)
  
  for (const plan of plans) {
    const planDate = new Date(leave)
    planDate.setMonth(planDate.getMonth() + plan.months)
    
    await supabase
      .from('follow_up_plans')
      .insert({
        employee_id: employeeId,
        plan_date: planDate.toISOString().split('T')[0],
        follow_up_type: plan.type,
      })
  }
}
```

- [ ] **Step 4: 创建报告数据服务**

```typescript
// lib/db/reports.ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Report, ReportFilters, ReportContent } from '@/types/report'

export async function getReports() {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data as Report[]
}

export async function getReportById(id: string) {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return data as Report
}

export async function generateReportContent(filters: ReportFilters): Promise<ReportContent> {
  const supabase = await createSupabaseServerClient()
  
  // 获取员工数据
  let employeeQuery = supabase.from('employees').select('*')
  
  if (filters.date_from) {
    employeeQuery = employeeQuery.gte('leave_date', filters.date_from)
  }
  if (filters.date_to) {
    employeeQuery = employeeQuery.lte('leave_date', filters.date_to)
  }
  if (filters.departments?.length) {
    employeeQuery = employeeQuery.in('department', filters.departments)
  }
  if (filters.leave_reasons?.length) {
    employeeQuery = employeeQuery.in('leave_reason', filters.leave_reasons)
  }
  
  const { data: employees } = await employeeQuery
  
  // 获取回访记录
  const { data: followUpRecords } = await supabase
    .from('follow_up_records')
    .select('*')
  
  // 计算统计数据
  const totalEmployees = employees?.length || 0
  const followedEmployees = employees?.filter(e => e.status === 'followed').length || 0
  
  const leaveReasons: Record<string, number> = {}
  employees?.forEach(e => {
    leaveReasons[e.leave_reason] = (leaveReasons[e.leave_reason] || 0) + 1
  })
  
  const salaryChanges: Record<string, number> = { increase: 0, decrease: 0, same: 0 }
  followUpRecords?.forEach(r => {
    if (r.salary_change) {
      salaryChanges[r.salary_change]++
    }
  })
  
  const companyCount: Record<string, number> = {}
  followUpRecords?.forEach(r => {
    if (r.new_company) {
      companyCount[r.new_company] = (companyCount[r.new_company] || 0) + 1
    }
  })
  
  const newCompanies = Object.entries(companyCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  const suggestions = followUpRecords
    ?.filter(r => r.suggestions)
    .map(r => r.suggestions) || []
  
  return {
    summary: {
      total_employees: totalEmployees,
      follow_up_rate: totalEmployees ? followedEmployees / totalEmployees : 0,
      survey_response_rate: 0,
    },
    leave_reasons: leaveReasons,
    salary_changes: salaryChanges,
    new_companies: newCompanies,
    suggestions: suggestions,
  }
}

export async function createReport(formData: {
  title: string
  type: string
  filters: ReportFilters
}) {
  const supabase = await createSupabaseServerClient()
  
  const content = await generateReportContent(formData.filters)
  
  const { data, error } = await supabase
    .from('reports')
    .insert({
      title: formData.title,
      type: formData.type,
      filters: formData.filters as unknown as Record<string, unknown>,
      content: content as unknown as Record<string, unknown>,
    })
    .select()
    .single()

  if (error) throw error

  return data as Report
}
```

- [ ] **Step 5: 提交数据服务层**

```bash
git add .
git commit -m "feat: 添加数据库操作服务层"
```

---

### Task 9: 离职员工管理页面

**Files:**
- Create: `app/(dashboard)/dashboard/page.tsx`
- Create: `app/(dashboard)/employees/page.tsx`
- Create: `app/(dashboard)/employees/add/page.tsx`
- Create: `app/(dashboard)/employees/import/page.tsx`
- Create: `app/(dashboard)/employees/[id]/page.tsx`
- Create: `components/employees/employee-form.tsx`
- Create: `components/employees/employee-list.tsx`
- Create: `components/employees/employee-import.tsx`

- [ ] **Step 1: 创建仪表盘页面**

```typescript
// app/(dashboard)/dashboard/page.tsx
import { getEmployeeStats } from '@/lib/db/employees'
import { getFollowUpStats, getUpcomingFollowUps } from '@/lib/db/follow-ups'
import { getSurveyResponseRate } from '@/lib/db/questionnaires'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, FileText, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const employeeStats = await getEmployeeStats()
  const followUpStats = await getFollowUpStats()
  const surveyStats = await getSurveyResponseRate()
  const upcomingFollowUps = await getUpcomingFollowUps(7)

  const stats = [
    {
      title: '离职员工总数',
      value: employeeStats.total,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: '回访完成率',
      value: `${(followUpStats.rate * 100).toFixed(1)}%`,
      icon: UserCheck,
      color: 'text-green-600',
    },
    {
      title: '问卷回收率',
      value: `${(surveyStats.rate * 100).toFixed(1)}%`,
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      title: '待回访',
      value: followUpStats.pending,
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">仪表盘</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>近7天待回访</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingFollowUps.length === 0 ? (
              <p className="text-slate-500 text-sm">暂无待回访计划</p>
            ) : (
              <div className="space-y-3">
                {upcomingFollowUps.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{plan.employee?.name}</p>
                      <p className="text-sm text-slate-500">
                        {plan.employee?.department} · {plan.plan_date}
                      </p>
                    </div>
                    <Badge variant="outline">{plan.follow_up_type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>离职原因分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(employeeStats.leaveReasons).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between">
                  <span className="text-sm">{reason}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${(count / employeeStats.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-slate-500 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建员工列表组件**

```typescript
// components/employees/employee-list.tsx
'use client'

import { Employee } from '@/types/employee'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, Send } from 'lucide-react'
import Link from 'next/link'

interface EmployeeListProps {
  employees: Employee[]
  onSendSurvey?: (employeeId: string) => void
}

export function EmployeeList({ employees, onSendSurvey }: EmployeeListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>姓名</TableHead>
          <TableHead>部门</TableHead>
          <TableHead>职位</TableHead>
          <TableHead>离职日期</TableHead>
          <TableHead>离职原因</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell className="font-medium">{employee.name}</TableCell>
            <TableCell>{employee.department}</TableCell>
            <TableCell>{employee.position}</TableCell>
            <TableCell>{employee.leave_date}</TableCell>
            <TableCell>{employee.leave_reason}</TableCell>
            <TableCell>
              <Badge variant={employee.status === 'followed' ? 'default' : 'secondary'}>
                {employee.status === 'followed' ? '已回访' : '待回访'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Link href={`/employees/${employee.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                {onSendSurvey && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSendSurvey(employee.id)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 3: 创建员工表单组件**

```typescript
// components/employees/employee-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LEAVE_REASONS, DEPARTMENTS } from '@/types/employee'

const formSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  phone: z.string().min(1, '请输入手机号'),
  email: z.string().email('请输入有效邮箱'),
  department: z.string().min(1, '请选择部门'),
  position: z.string().min(1, '请输入职位'),
  leave_date: z.string().min(1, '请选择离职日期'),
  leave_reason: z.string().min(1, '请选择离职原因'),
  employment_duration: z.number().min(0, '在职时长不能为负数'),
})

type FormValues = z.infer<typeof formSchema>

interface EmployeeFormProps {
  defaultValues?: Partial<FormValues>
  onSubmit: (data: FormValues) => Promise<void>
  isEdit?: boolean
}

export function EmployeeForm({ defaultValues, onSubmit, isEdit }: EmployeeFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      department: '',
      position: '',
      leave_date: '',
      leave_reason: '',
      employment_duration: 0,
      ...defaultValues,
    },
  })

  const handleSubmit = async (data: FormValues) => {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>姓名</FormLabel>
                <FormControl>
                  <Input placeholder="请输入姓名" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>手机号</FormLabel>
                <FormControl>
                  <Input placeholder="请输入手机号" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input placeholder="请输入邮箱" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>部门</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择部门" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>职位</FormLabel>
                <FormControl>
                  <Input placeholder="请输入职位" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="leave_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>离职日期</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employment_duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>在职时长(月)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="请输入在职时长"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="leave_reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>离职原因</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择离职原因" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LEAVE_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {isEdit ? '保存修改' : '添加员工'}
        </Button>
      </form>
    </Form>
  )
}
```

- [ ] **Step 4: 创建员工列表页面**

```typescript
// app/(dashboard)/employees/page.tsx
import { getEmployees } from '@/lib/db/employees'
import { EmployeeList } from '@/components/employees/employee-list'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import Link from 'next/link'

export default async function EmployeesPage() {
  const { data: employees } = await getEmployees()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">离职员工管理</h2>
        <div className="flex gap-2">
          <Link href="/employees/import">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              批量导入
            </Button>
          </Link>
          <Link href="/employees/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增员工
            </Button>
          </Link>
        </div>
      </div>

      <EmployeeList employees={employees} />
    </div>
  )
}
```

- [ ] **Step 5: 创建新增员工页面**

```typescript
// app/(dashboard)/employees/add/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createEmployee } from '@/lib/db/employees'
import { createDefaultFollowUpPlans } from '@/lib/db/follow-ups'
import { EmployeeForm } from '@/components/employees/employee-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AddEmployeePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: any) => {
    setLoading(true)
    try {
      const employee = await createEmployee(data)
      await createDefaultFollowUpPlans(employee.id, data.leave_date)
      router.push('/employees')
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>新增离职员工</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 6: 创建员工导入组件**

```typescript
// components/employees/employee-import.tsx
'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileSpreadsheet } from 'lucide-react'

interface EmployeeImportProps {
  onImport: (data: any[]) => Promise<void>
}

export function EmployeeImport({ onImport }: EmployeeImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    // 简单的CSV解析预览
    const text = await selectedFile.text()
    const lines = text.split('\n').slice(0, 6) // 预览前5行
    const headers = lines[0].split(',')
    const rows = lines.slice(1).map(line => {
      const values = line.split(',')
      return headers.reduce((obj, header, i) => {
        obj[header.trim()] = values[i]?.trim()
        return obj
      }, {} as any)
    })
    setPreview(rows)
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    try {
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',')
      const data = lines.slice(1).map(line => {
        const values = line.split(',')
        return headers.reduce((obj, header, i) => {
          obj[header.trim()] = values[i]?.trim()
          return obj
        }, {} as any)
      }).filter(row => Object.values(row).some(v => v))

      await onImport(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>批量导入员工</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <span className="font-medium">{file.name}</span>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <p className="text-slate-600">点击或拖拽上传 CSV 文件</p>
              <p className="text-sm text-slate-400 mt-1">
                格式: 姓名,手机号,邮箱,部门,职位,离职日期,离职原因,在职时长
              </p>
            </>
          )}
        </div>

        {preview.length > 0 && (
          <div className="border rounded-lg p-4">
            <p className="text-sm font-medium mb-2">数据预览 (前5行)</p>
            <pre className="text-xs bg-slate-50 p-2 rounded overflow-auto">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </div>
        )}

        <Button
          className="w-full"
          disabled={!file || loading}
          onClick={handleImport}
        >
          {loading ? '导入中...' : '确认导入'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 7: 创建员工导入页面**

```typescript
// app/(dashboard)/employees/import/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { EmployeeImport } from '@/components/employees/employee-import'
import { importEmployees } from '@/lib/db/employees'

export default function ImportEmployeesPage() {
  const router = useRouter()

  const handleImport = async (data: any[]) => {
    const employees = data.map(row => ({
      name: row['姓名'] || row['name'],
      phone: row['手机号'] || row['phone'],
      email: row['邮箱'] || row['email'],
      department: row['部门'] || row['department'],
      position: row['职位'] || row['position'],
      leave_date: row['离职日期'] || row['leave_date'],
      leave_reason: row['离职原因'] || row['leave_reason'],
      employment_duration: Number(row['在职时长'] || row['employment_duration'] || 0),
    }))

    await importEmployees(employees)
    router.push('/employees')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <EmployeeImport onImport={handleImport} />
    </div>
  )
}
```

- [ ] **Step 8: 创建员工详情页面**

```typescript
// app/(dashboard)/employees/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getEmployeeById } from '@/lib/db/employees'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function EmployeeDetailPage({
  params,
}: {
  params: { id: string }
}) {
  let employee
  try {
    employee = await getEmployeeById(params.id)
  } catch {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>员工详情</CardTitle>
            <Badge variant={employee.status === 'followed' ? 'default' : 'secondary'}>
              {employee.status === 'followed' ? '已回访' : '待回访'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-slate-500">姓名</dt>
              <dd className="font-medium">{employee.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">手机号</dt>
              <dd>{employee.phone}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">邮箱</dt>
              <dd>{employee.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">部门</dt>
              <dd>{employee.department}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">职位</dt>
              <dd>{employee.position}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">离职日期</dt>
              <dd>{employee.leave_date}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">离职原因</dt>
              <dd>{employee.leave_reason}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">在职时长</dt>
              <dd>{employee.employment_duration} 个月</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 9: 提交员工管理模块**

```bash
git add .
git commit -m "feat: 添加离职员工管理页面"
```

---

### Task 10: 问卷管理页面

**Files:**
- Create: `app/(dashboard)/questionnaires/page.tsx`
- Create: `app/(dashboard)/questionnaires/create/page.tsx`
- Create: `app/(dashboard)/questionnaires/[id]/page.tsx`
- Create: `app/survey/[token]/page.tsx`
- Create: `components/questionnaires/questionnaire-form.tsx`
- Create: `components/questionnaires/question-editor.tsx`

- [ ] **Step 1: 创建问卷列表页面**

```typescript
// app/(dashboard)/questionnaires/page.tsx
import { getQuestionnaires } from '@/lib/db/questionnaires'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function QuestionnairesPage() {
  const questionnaires = await getQuestionnaires()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">问卷管理</h2>
        <Link href="/questionnaires/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            创建问卷
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {questionnaires.map((q) => (
          <Card key={q.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{q.title}</CardTitle>
                <Badge
                  variant={
                    q.status === 'active'
                      ? 'default'
                      : q.status === 'draft'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {q.status === 'active'
                    ? '已发布'
                    : q.status === 'draft'
                    ? '草稿'
                    : '已归档'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">{q.description}</p>
              <p className="text-sm text-slate-400 mt-2">
                {(q.questions as any[]).length} 道题目
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建问卷编辑器组件**

```typescript
// components/questionnaires/question-editor.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { Question, QuestionType } from '@/types/questionnaire'

interface QuestionEditorProps {
  questions: Question[]
  onChange: (questions: Question[]) => void
}

export function QuestionEditor({ questions, onChange }: QuestionEditorProps) {
  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type: 'single',
      title: '',
      required: true,
      options: ['选项1', '选项2'],
    }
    onChange([...questions, newQuestion])
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onChange(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    )
  }

  const removeQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id))
  }

  const addOption = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId)
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, `选项${question.options.length + 1}`],
      })
    }
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium">题目 {index + 1}</span>
              <Select
                value={question.type}
                onValueChange={(value) =>
                  updateQuestion(question.id, {
                    type: value as QuestionType,
                    options:
                      value === 'single' || value === 'multiple'
                        ? question.options || ['选项1', '选项2']
                        : undefined,
                  })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">单选题</SelectItem>
                  <SelectItem value="multiple">多选题</SelectItem>
                  <SelectItem value="text">填空题</SelectItem>
                  <SelectItem value="rating">评分题</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeQuestion(question.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="请输入题目"
              value={question.title}
              onChange={(e) =>
                updateQuestion(question.id, { title: e.target.value })
              }
            />

            {(question.type === 'single' || question.type === 'multiple') && (
              <div className="space-y-2">
                {question.options?.map((option, i) => (
                  <Input
                    key={i}
                    placeholder={`选项 ${i + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])]
                      newOptions[i] = e.target.value
                      updateQuestion(question.id, { options: newOptions })
                    }}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(question.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  添加选项
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addQuestion} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        添加题目
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: 创建问卷表单组件**

```typescript
// components/questionnaires/questionnaire-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { QuestionEditor } from './question-editor'
import type { Question } from '@/types/questionnaire'

const formSchema = z.object({
  title: z.string().min(1, '请输入问卷标题'),
  description: z.string(),
})

type FormValues = z.infer<typeof formSchema>

interface QuestionnaireFormProps {
  defaultValues?: Partial<FormValues & { questions: Question[] }>
  onSubmit: (data: FormValues & { questions: Question[] }) => Promise<void>
}

export function QuestionnaireForm({ defaultValues, onSubmit }: QuestionnaireFormProps) {
  const [questions, setQuestions] = useState<Question[]>(
    defaultValues?.questions || []
  )
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      ...defaultValues,
    },
  })

  const handleSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      await onSubmit({ ...data, questions })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>问卷标题</FormLabel>
              <FormControl>
                <Input placeholder="请输入问卷标题" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>问卷描述</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请输入问卷描述（可选）"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>问卷题目</FormLabel>
          <div className="mt-2">
            <QuestionEditor
              questions={questions}
              onChange={setQuestions}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '保存中...' : '保存问卷'}
        </Button>
      </form>
    </Form>
  )
}
```

- [ ] **Step 4: 创建问卷创建页面**

```typescript
// app/(dashboard)/questionnaires/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { createQuestionnaire } from '@/lib/db/questionnaires'
import { QuestionnaireForm } from '@/components/questionnaires/questionnaire-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreateQuestionnairePage() {
  const router = useRouter()

  const handleSubmit = async (data: any) => {
    await createQuestionnaire(data)
    router.push('/questionnaires')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>创建问卷</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionnaireForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: 创建问卷详情页面**

```typescript
// app/(dashboard)/questionnaires/[id]/page.tsx
'use client'

import { useState } from 'react'
import { getQuestionnaireById, updateQuestionnaire, generateSurveyToken } from '@/lib/db/questionnaires'
import { QuestionnaireForm } from '@/components/questionnaires/questionnaire-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function QuestionnaireDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [employeeId, setEmployeeId] = useState('')
  const [surveyLink, setSurveyLink] = useState('')

  const handleGenerateLink = async () => {
    if (!employeeId) return
    const token = await generateSurveyToken(employeeId, params.id)
    const link = `${window.location.origin}/survey/${token.token}`
    setSurveyLink(link)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>编辑问卷</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 问卷表单内容 */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>生成问卷链接</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="输入员工ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
          <Button onClick={handleGenerateLink}>生成链接</Button>
          {surveyLink && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium mb-1">问卷链接：</p>
              <p className="text-sm text-primary break-all">{surveyLink}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 6: 创建员工填写问卷页面**

```typescript
// app/survey/[token]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { validateSurveyToken, submitSurveyResponse } from '@/lib/db/questionnaires'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter } from 'next/navigation'

export default function SurveyPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true)
  const [surveyData, setSurveyData] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    validateSurveyToken(params.token)
      .then((data) => {
        setSurveyData(data)
      })
      .catch((error) => {
        alert(error.message)
        router.push('/')
      })
      .finally(() => setLoading(false))
  }, [params.token, router])

  const handleSubmit = async () => {
    try {
      await submitSurveyResponse(params.token, answers)
      setSubmitted(true)
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>加载中...</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-medium">感谢您的参与！</p>
            <p className="text-slate-500 mt-2">您的回答已成功提交。</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const questionnaire = surveyData?.questionnaires as any
  const employee = surveyData?.employees as any
  const questions = questionnaire?.questions as any[] || []

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{questionnaire?.title}</CardTitle>
          <p className="text-sm text-slate-500">{questionnaire?.description}</p>
          <p className="text-sm text-slate-400 mt-2">
            尊敬的 {employee?.name} 您好，请填写以下问卷
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((q: any, index: number) => (
            <div key={q.id} className="space-y-2">
              <p className="font-medium">
                {index + 1}. {q.title}
              </p>

              {q.type === 'single' && (
                <RadioGroup
                  onValueChange={(value) =>
                    setAnswers({ ...answers, [q.id]: value })
                  }
                >
                  {q.options?.map((opt: string, i: number) => (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
                      <label htmlFor={`${q.id}-${i}`}>{opt}</label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {q.type === 'multiple' && (
                <div className="space-y-2">
                  {q.options?.map((opt: string, i: number) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${q.id}-${i}`}
                        onCheckedChange={(checked) => {
                          const current = answers[q.id] || []
                          if (checked) {
                            setAnswers({ ...answers, [q.id]: [...current, opt] })
                          } else {
                            setAnswers({
                              ...answers,
                              [q.id]: current.filter((v: string) => v !== opt),
                            })
                          }
                        }}
                      />
                      <label htmlFor={`${q.id}-${i}`}>{opt}</label>
                    </div>
                  ))}
                </div>
              )}

              {q.type === 'text' && (
                <Textarea
                  onChange={(e) =>
                    setAnswers({ ...answers, [q.id]: e.target.value })
                  }
                />
              )}

              {q.type === 'rating' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Button
                      key={num}
                      variant={answers[q.id] === num ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAnswers({ ...answers, [q.id]: num })}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Button className="w-full" onClick={handleSubmit}>
            提交问卷
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 7: 提交问卷管理模块**

```bash
git add .
git commit -m "feat: 添加问卷管理页面和员工填写问卷功能"
```

---

### Task 11: 回访管理页面

**Files:**
- Create: `app/(dashboard)/follow-ups/page.tsx`
- Create: `app/(dashboard)/follow-ups/[id]/page.tsx`
- Create: `components/follow-ups/follow-up-form.tsx`
- Create: `components/follow-ups/follow-up-list.tsx`

- [ ] **Step 1: 创建回访列表组件**

```typescript
// components/follow-ups/follow-up-list.tsx
'use client'

import { FollowUpPlan } from '@/types/follow-up'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'

interface FollowUpListProps {
  plans: FollowUpPlan[]
}

export function FollowUpList({ plans }: FollowUpListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>员工姓名</TableHead>
          <TableHead>部门</TableHead>
          <TableHead>计划日期</TableHead>
          <TableHead>回访类型</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell className="font-medium">
              {plan.employee?.name}
            </TableCell>
            <TableCell>{plan.employee?.department}</TableCell>
            <TableCell>{plan.plan_date}</TableCell>
            <TableCell>
              {plan.follow_up_type === '1m' && '1个月'}
              {plan.follow_up_type === '3m' && '3个月'}
              {plan.follow_up_type === '6m' && '6个月'}
              {plan.follow_up_type === 'custom' && '自定义'}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  plan.status === 'completed'
                    ? 'default'
                    : plan.status === 'overdue'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {plan.status === 'completed'
                  ? '已完成'
                  : plan.status === 'overdue'
                  ? '已逾期'
                  : '待回访'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/follow-ups/${plan.id}`}
                className="text-primary hover:underline text-sm"
              >
                查看详情
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 2: 创建回访记录表单组件**

```typescript
// components/follow-ups/follow-up-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CONTACT_METHODS,
  CONTACT_RESULTS,
  SALARY_CHANGES,
} from '@/types/follow-up'

const formSchema = z.object({
  contact_method: z.string(),
  contact_result: z.string(),
  new_company: z.string(),
  new_position: z.string(),
  salary_change: z.string(),
  personal_feeling: z.string(),
  suggestions: z.string(),
})

type FormValues = z.infer<typeof formSchema>

interface FollowUpFormProps {
  onSubmit: (data: FormValues) => Promise<void>
}

export function FollowUpForm({ onSubmit }: FollowUpFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contact_method: 'phone',
      contact_result: 'connected',
      new_company: '',
      new_position: '',
      salary_change: 'same',
      personal_feeling: '',
      suggestions: '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contact_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>联系方式</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONTACT_METHODS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_result"
            render={({ field }) => (
              <FormItem>
                <FormLabel>联系结果</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONTACT_RESULTS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="new_company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>新公司</FormLabel>
                <FormControl>
                  <Input placeholder="请输入新公司名称" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="new_position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>新职位</FormLabel>
                <FormControl>
                  <Input placeholder="请输入新职位" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="salary_change"
          render={({ field }) => (
            <FormItem>
              <FormLabel>薪资变化</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SALARY_CHANGES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="personal_feeling"
          render={({ field }) => (
            <FormItem>
              <FormLabel>个人感受</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请记录员工的个人感受和状态"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="suggestions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>对公司建议</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请记录员工对公司的建议"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          提交回访记录
        </Button>
      </form>
    </Form>
  )
}
```

- [ ] **Step 3: 创建回访列表页面**

```typescript
// app/(dashboard)/follow-ups/page.tsx
import { getFollowUpPlans } from '@/lib/db/follow-ups'
import { FollowUpList } from '@/components/follow-ups/follow-up-list'

export default async function FollowUpsPage() {
  const { data: plans } = await getFollowUpPlans()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">回访管理</h2>
      <FollowUpList plans={plans} />
    </div>
  )
}
```

- [ ] **Step 4: 创建回访详情页面**

```typescript
// app/(dashboard)/follow-ups/[id]/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { getFollowUpPlanById, createFollowUpRecord } from '@/lib/db/follow-ups'
import { FollowUpForm } from '@/components/follow-ups/follow-up-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function FollowUpDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()

  const handleSubmit = async (data: any) => {
    // 获取计划信息
    const plan = await getFollowUpPlanById(params.id)
    await createFollowUpRecord(params.id, plan.employee_id, data)
    router.push('/follow-ups')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>录入回访记录</CardTitle>
        </CardHeader>
        <CardContent>
          <FollowUpForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: 提交回访管理模块**

```bash
git add .
git commit -m "feat: 添加回访管理页面"
```

---

## Phase 3: 数据分析与报告

### Task 12: 数据分析页面

**Files:**
- Create: `app/(dashboard)/analytics/page.tsx`
- Create: `app/(dashboard)/analytics/trends/page.tsx`
- Create: `app/(dashboard)/analytics/insights/page.tsx`
- Create: `components/analytics/pie-chart.tsx`
- Create: `components/analytics/line-chart.tsx`
- Create: `components/analytics/bar-chart.tsx`

- [ ] **Step 1: 创建饼图组件**

```typescript
// components/analytics/pie-chart.tsx
'use client'

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface PieChartProps {
  data: { name: string; value: number }[]
  title?: string
}

export function PieChart({ data, title }: PieChartProps) {
  return (
    <div className="w-full h-80">
      {title && <p className="text-center font-medium mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: 创建折线图组件**

```typescript
// components/analytics/line-chart.tsx
'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface LineChartProps {
  data: { name: string; [key: string]: string | number }[]
  lines: { key: string; color: string; name: string }[]
  title?: string
}

export function LineChart({ data, lines, title }: LineChartProps) {
  return (
    <div className="w-full h-80">
      {title && <p className="text-center font-medium mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              name={line.name}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: 创建柱状图组件**

```typescript
// components/analytics/bar-chart.tsx
'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface BarChartProps {
  data: { name: string; [key: string]: string | number }[]
  bars: { key: string; color: string; name: string }[]
  title?: string
}

export function BarChart({ data, bars, title }: BarChartProps) {
  return (
    <div className="w-full h-80">
      {title && <p className="text-center font-medium mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              fill={bar.color}
              name={bar.name}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 4: 创建数据分析页面**

```typescript
// app/(dashboard)/analytics/page.tsx
import { getEmployeeStats } from '@/lib/db/employees'
import { getFollowUpStats } from '@/lib/db/follow-ups'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart } from '@/components/analytics/pie-chart'

export default async function AnalyticsPage() {
  const employeeStats = await getEmployeeStats()
  const followUpStats = await getFollowUpStats()

  const leaveReasonData = Object.entries(employeeStats.leaveReasons).map(
    ([name, value]) => ({ name, value })
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">数据分析</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>离职原因分布</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={leaveReasonData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>回访统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>总计划数</span>
                <span className="font-bold">{followUpStats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>已完成</span>
                <span className="font-bold text-green-600">
                  {followUpStats.completed}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>待回访</span>
                <span className="font-bold text-orange-600">
                  {followUpStats.pending}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>完成率</span>
                <span className="font-bold">
                  {(followUpStats.rate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 提交数据分析模块**

```bash
git add .
git commit -m "feat: 添加数据分析页面和图表组件"
```

---

### Task 13: 报告生成与导出

**Files:**
- Create: `app/(dashboard)/reports/page.tsx`
- Create: `app/(dashboard)/reports/generate/page.tsx`
- Create: `app/(dashboard)/reports/[id]/page.tsx`
- Create: `lib/report/pdf.ts`
- Create: `lib/report/word.ts`
- Create: `components/reports/report-preview.tsx`

- [ ] **Step 1: 创建PDF报告生成**

```typescript
// lib/report/pdf.ts
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'
import type { ReportContent } from '@/types/report'

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
})

interface ReportDocumentProps {
  title: string
  content: ReportContent
}

function ReportDocument({ title, content }: ReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>概览</Text>
          <Text style={styles.text}>
            离职员工总数: {content.summary.total_employees}
          </Text>
          <Text style={styles.text}>
            回访完成率: {(content.summary.follow_up_rate * 100).toFixed(1)}%
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>离职原因分布</Text>
          {Object.entries(content.leave_reasons).map(([reason, count]) => (
            <Text key={reason} style={styles.text}>
              {reason}: {count}人
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>薪资变化</Text>
          <Text style={styles.text}>
            涨薪: {content.salary_changes.increase}人
          </Text>
          <Text style={styles.text}>
            降薪: {content.salary_changes.decrease}人
          </Text>
          <Text style={styles.text}>
            持平: {content.salary_changes.same}人
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generatePDFReport(title: string, content: ReportContent) {
  const blob = await pdf(<ReportDocument title={title} content={content} />).toBlob()
  return blob
}
```

- [ ] **Step 2: 创建Word报告生成**

```typescript
// lib/report/word.ts
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from 'docx'
import type { ReportContent } from '@/types/report'

export async function generateWordReport(title: string, content: ReportContent) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
          }),

          new Paragraph({
            text: '概览',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun(`离职员工总数: ${content.summary.total_employees}`),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                `回访完成率: ${(content.summary.follow_up_rate * 100).toFixed(1)}%`
              ),
            ],
          }),

          new Paragraph({
            text: '离职原因分布',
            heading: HeadingLevel.HEADING_1,
          }),
          ...Object.entries(content.leave_reasons).map(
            ([reason, count]) =>
              new Paragraph({
                children: [new TextRun(`${reason}: ${count}人`)],
              })
          ),

          new Paragraph({
            text: '薪资变化',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun(`涨薪: ${content.salary_changes.increase}人`),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(`降薪: ${content.salary_changes.decrease}人`),
            ],
          }),
          new Paragraph({
            children: [new TextRun(`持平: ${content.salary_changes.same}人`)],
          }),

          new Paragraph({
            text: '员工建议',
            heading: HeadingLevel.HEADING_1,
          }),
          ...content.suggestions.slice(0, 10).map(
            (suggestion) =>
              new Paragraph({
                children: [new TextRun(`• ${suggestion}`)],
              })
          ),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  return blob
}
```

- [ ] **Step 3: 创建报告列表页面**

```typescript
// app/(dashboard)/reports/page.tsx
import { getReports } from '@/lib/db/reports'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function ReportsPage() {
  const reports = await getReports()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">报告中心</h2>
        <Link href="/reports/generate">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            生成报告
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle className="text-lg">{report.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                创建时间: {new Date(report.created_at).toLocaleString('zh-CN')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 创建报告生成页面**

```typescript
// app/(dashboard)/reports/generate/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createReport } from '@/lib/db/reports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { REPORT_TYPES } from '@/types/report'

export default function GenerateReportPage() {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('summary')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    if (!title) return
    setLoading(true)
    try {
      await createReport({
        title,
        type,
        filters: {},
      })
      router.push('/reports')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>生成报告</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">报告标题</label>
            <Input
              placeholder="请输入报告标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">报告类型</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={loading || !title}
          >
            {loading ? '生成中...' : '生成报告'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: 创建报告详情页面**

```typescript
// app/(dashboard)/reports/[id]/page.tsx
'use client'

import { useState } from 'react'
import { getReportById } from '@/lib/db/reports'
import { generatePDFReport } from '@/lib/report/pdf'
import { generateWordReport } from '@/lib/report/word'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileText, FileSpreadsheet } from 'lucide-react'

export default function ReportDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleExportPDF = async () => {
    setLoading('pdf')
    try {
      const report = await getReportById(params.id)
      const blob = await generatePDFReport(
        report.title,
        report.content as any
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(null)
    }
  }

  const handleExportWord = async () => {
    setLoading('word')
    try {
      const report = await getReportById(params.id)
      const blob = await generateWordReport(
        report.title,
        report.content as any
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>报告详情</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={loading === 'pdf'}
              >
                <FileText className="h-4 w-4 mr-2" />
                导出PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleExportWord}
                disabled={loading === 'word'}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                导出Word
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 报告内容展示 */}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 6: 提交报告模块**

```bash
git add .
git commit -m "feat: 添加报告生成与导出功能"
```

---

### Task 14: 系统设置页面

**Files:**
- Create: `app/(dashboard)/settings/page.tsx`
- Create: `app/(dashboard)/settings/users/page.tsx`
- Create: `app/(dashboard)/settings/oauth/page.tsx`

- [ ] **Step 1: 创建系统设置页面**

```typescript
// app/(dashboard)/settings/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">系统设置</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/settings/users">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>用户管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                管理系统用户和权限设置
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/oauth">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>OAuth配置</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                配置企业微信、钉钉登录
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建用户管理页面**

```typescript
// app/(dashboard)/settings/users/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function UsersPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">
            在 Supabase 控制台中管理用户账户和权限。
          </p>
          <Button asChild>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              打开 Supabase 控制台
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: 创建OAuth配置页面**

```typescript
// app/(dashboard)/settings/oauth/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function OAuthPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>企业微信配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Corp ID</label>
            <Input placeholder="请输入企业ID" />
          </div>
          <div>
            <label className="text-sm font-medium">Agent ID</label>
            <Input placeholder="请输入应用ID" />
          </div>
          <div>
            <label className="text-sm font-medium">Secret</label>
            <Input type="password" placeholder="请输入应用Secret" />
          </div>
          <Button>保存配置</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>钉钉配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">App Key</label>
            <Input placeholder="请输入AppKey" />
          </div>
          <div>
            <label className="text-sm font-medium">App Secret</label>
            <Input type="password" placeholder="请输入AppSecret" />
          </div>
          <Button>保存配置</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: 提交系统设置模块**

```bash
git add .
git commit -m "feat: 添加系统设置页面"
```

---

### Task 15: 首页重定向

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: 创建首页重定向**

```typescript
// app/page.tsx
import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/dashboard')
}
```

- [ ] **Step 2: 提交首页**

```bash
git add .
git commit -m "feat: 添加首页重定向到仪表盘"
```

---

## 完成检查清单

- [ ] 所有页面可正常访问
- [ ] 认证流程正常工作
- [ ] 员工增删改查功能正常
- [ ] 问卷创建和填写功能正常
- [ ] 回访记录功能正常
- [ ] 数据分析图表正确显示
- [ ] 报告生成和导出功能正常
- [ ] 响应式布局正常

---

## 部署说明

1. 在 Supabase 创建项目并获取连接信息
2. 执行数据库迁移脚本
3. 配置环境变量
4. 运行 `npm run build` 构建生产版本
5. 部署到 Vercel 或其他支持 Next.js 的平台
