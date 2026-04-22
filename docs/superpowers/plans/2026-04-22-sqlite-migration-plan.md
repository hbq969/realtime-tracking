# SQLite 迁移实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Supabase 数据库迁移到本地 SQLite，实现零外部依赖的单机部署方案。

**Architecture:** 使用 better-sqlite3 作为嵌入式数据库，简单密码 + Cookie Session 实现认证，本地文件系统存储文件。

**Tech Stack:** Next.js 16, better-sqlite3, TypeScript

---

## 文件结构

```
lib/
├── db/
│   ├── index.ts          # SQLite 初始化和连接 (新建)
│   ├── employees.ts      # 员工数据操作 (重写)
│   ├── questionnaires.ts # 问卷数据操作 (重写)
│   ├── follow-ups.ts     # 回访数据操作 (重写)
│   └── reports.ts        # 报告数据操作 (重写)
├── auth/
│   ├── index.ts          # 认证模块 (新建)
│   └── config.ts         # 认证配置 (新建)
├── storage/
│   └── index.ts          # 文件存储模块 (新建)
└── supabase/             # 删除整个目录

types/
├── db.ts                 # SQLite 类型定义 (新建)
└── database.ts           # 删除

data/                     # SQLite 数据库文件目录 (新建)
uploads/                  # 文件存储目录 (新建)
```

---

### Task 1: 安装依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 better-sqlite3 及类型定义**

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

- [ ] **Step 2: 卸载 Supabase 依赖**

```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 3: 提交依赖变更**

```bash
git add package.json package-lock.json
git commit -m "chore: 替换 Supabase 依赖为 better-sqlite3"
```

---

### Task 2: 创建 SQLite 数据库模块

**Files:**
- Create: `lib/db/index.ts`
- Create: `types/db.ts`
- Create: `data/.gitkeep`

- [ ] **Step 1: 创建数据库类型定义文件**

创建 `types/db.ts`:

```typescript
/**
 * SQLite 数据库类型定义
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// 员工表
export interface EmployeeRow {
  id: string
  name: string
  phone: string | null
  email: string | null
  department: string | null
  team: string | null
  position: string | null
  leave_date: string | null
  leave_reason: string | null
  employment_duration: number | null
  reporter_id: string | null
  status: 'pending' | 'followed'
  created_at: string
  updated_at: string
}

// 问卷表
export interface QuestionnaireRow {
  id: string
  title: string
  description: string | null
  questions: string  // JSON string
  status: 'draft' | 'active' | 'archived'
  created_at: string
  external_url: string | null
  external_type: string | null
  email_subject: string | null
  email_body: string | null
}

// 问卷令牌表
export interface SurveyTokenRow {
  id: string
  token: string
  employee_id: string | null
  questionnaire_id: string | null
  used: number  // 0 or 1
  expires_at: string | null
  created_at: string
}

// 问卷回答表
export interface SurveyResponseRow {
  id: string
  employee_id: string | null
  questionnaire_id: string | null
  answers: string  // JSON string
  submit_channel: 'survey' | 'manual'
  submitted_at: string
}

// 回访计划表
export interface FollowUpPlanRow {
  id: string
  employee_id: string | null
  plan_date: string | null
  follow_up_type: '1m' | '3m' | '6m' | 'custom'
  status: 'pending' | 'completed' | 'overdue'
  reminder_sent: number  // 0 or 1
  created_at: string
}

// 回访记录表
export interface FollowUpRecordRow {
  id: string
  plan_id: string | null
  employee_id: string | null
  contact_method: 'phone' | 'wechat' | 'email'
  contact_result: 'connected' | 'no_answer' | 'refused'
  new_company: string | null
  new_position: string | null
  salary_change: 'increase' | 'decrease' | 'same' | null
  personal_feeling: string | null
  suggestions: string | null
  created_at: string
}

// 报告表
export interface ReportRow {
  id: string
  title: string
  type: string
  filters: string | null  // JSON string
  content: string | null  // JSON string
  created_at: string
}
```

- [ ] **Step 2: 创建 SQLite 数据库初始化模块**

创建 `lib/db/index.ts`:

```typescript
/**
 * SQLite 数据库初始化和连接
 */
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// 数据库文件路径
const dataDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'realtime-tracking.db')

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// 创建数据库连接
export const db = new Database(dbPath)

// 启用 WAL 模式提升并发性能
db.pragma('journal_mode = WAL')

// 初始化数据库表
export function initDatabase() {
  db.exec(`
    -- 员工表
    CREATE TABLE IF NOT EXISTS employees (
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
    CREATE TABLE IF NOT EXISTS questionnaires (
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
    CREATE TABLE IF NOT EXISTS survey_tokens (
      id TEXT PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      employee_id TEXT,
      questionnaire_id TEXT,
      used INTEGER DEFAULT 0,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 问卷回答表
    CREATE TABLE IF NOT EXISTS survey_responses (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      questionnaire_id TEXT,
      answers TEXT,
      submit_channel TEXT DEFAULT 'survey',
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 回访计划表
    CREATE TABLE IF NOT EXISTS follow_up_plans (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      plan_date TEXT,
      follow_up_type TEXT,
      status TEXT DEFAULT 'pending',
      reminder_sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 回访记录表
    CREATE TABLE IF NOT EXISTS follow_up_records (
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
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT,
      filters TEXT,
      content TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 索引
    CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
    CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
    CREATE INDEX IF NOT EXISTS idx_survey_tokens_token ON survey_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_follow_up_plans_status ON follow_up_plans(status);
    CREATE INDEX IF NOT EXISTS idx_follow_up_plans_employee ON follow_up_plans(employee_id);
    CREATE INDEX IF NOT EXISTS idx_follow_up_records_employee ON follow_up_records(employee_id);
    CREATE INDEX IF NOT EXISTS idx_survey_responses_employee ON survey_responses(employee_id);
  `)
}

// 生成 UUID
export function generateId(): string {
  return crypto.randomUUID()
}

// 应用启动时初始化数据库
initDatabase()
```

- [ ] **Step 3: 创建数据目录占位文件**

创建 `data/.gitkeep`:

```
# 此目录用于存储 SQLite 数据库文件
```

- [ ] **Step 4: 提交数据库模块**

```bash
git add lib/db/index.ts types/db.ts data/.gitkeep
git commit -m "feat: 添加 SQLite 数据库初始化模块"
```

---

### Task 3: 创建认证模块

**Files:**
- Create: `lib/auth/config.ts`
- Create: `lib/auth/index.ts`

- [ ] **Step 1: 创建认证配置文件**

创建 `lib/auth/config.ts`:

```typescript
/**
 * 认证配置
 */

// 管理员账户配置
export const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
}

// Session 配置
export const SESSION_CONFIG = {
  cookieName: 'session',
  maxAge: 24 * 60 * 60, // 24小时
}
```

- [ ] **Step 2: 创建认证模块**

创建 `lib/auth/index.ts`:

```typescript
/**
 * 认证模块
 */
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { ADMIN_CREDENTIALS, SESSION_CONFIG } from './config'

// 存储有效的 session tokens (简单实现，生产环境建议使用 Redis 等)
const validSessions = new Set<string>()

/**
 * 生成 session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * 验证登录凭据
 */
export function verifyCredentials(username: string, password: string): boolean {
  return (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  )
}

/**
 * 创建 session
 */
export async function createSession(): Promise<string> {
  const token = generateSessionToken()
  validSessions.add(token)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_CONFIG.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_CONFIG.maxAge,
    path: '/',
  })

  return token
}

/**
 * 验证 session
 */
export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_CONFIG.cookieName)

  if (!session?.value) {
    return false
  }

  return validSessions.has(session.value)
}

/**
 * 清除 session
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_CONFIG.cookieName)

  if (session?.value) {
    validSessions.delete(session.value)
  }

  cookieStore.delete(SESSION_CONFIG.cookieName)
}
```

- [ ] **Step 3: 提交认证模块**

```bash
git add lib/auth/
git commit -m "feat: 添加简单密码认证模块"
```

---

### Task 4: 创建文件存储模块

**Files:**
- Create: `lib/storage/index.ts`
- Create: `uploads/.gitkeep`

- [ ] **Step 1: 创建文件存储模块**

创建 `lib/storage/index.ts`:

```typescript
/**
 * 本地文件存储模块
 */
import fs from 'fs/promises'
import path from 'path'

const STORAGE_DIR = path.join(process.cwd(), 'uploads')

/**
 * 确保目录存在
 */
async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

/**
 * 保存文件
 */
export async function saveFile(
  category: string,
  filename: string,
  data: Buffer | string
): Promise<string> {
  const dir = path.join(STORAGE_DIR, category)
  await ensureDir(dir)
  const filepath = path.join(dir, filename)
  await fs.writeFile(filepath, data)
  return filepath
}

/**
 * 读取文件
 */
export async function readFile(
  category: string,
  filename: string
): Promise<Buffer> {
  const filepath = path.join(STORAGE_DIR, category, filename)
  return fs.readFile(filepath)
}

/**
 * 删除文件
 */
export async function deleteFile(
  category: string,
  filename: string
): Promise<void> {
  const filepath = path.join(STORAGE_DIR, category, filename)
  try {
    await fs.unlink(filepath)
  } catch {
    // 忽略不存在的文件
  }
}

/**
 * 检查文件是否存在
 */
export async function fileExists(
  category: string,
  filename: string
): Promise<boolean> {
  const filepath = path.join(STORAGE_DIR, category, filename)
  try {
    await fs.access(filepath)
    return true
  } catch {
    return false
  }
}

/**
 * 列出目录下的文件
 */
export async function listFiles(category: string): Promise<string[]> {
  const dir = path.join(STORAGE_DIR, category)
  await ensureDir(dir)
  return fs.readdir(dir)
}

/**
 * 获取文件路径
 */
export function getFilePath(category: string, filename: string): string {
  return path.join(STORAGE_DIR, category, filename)
}
```

- [ ] **Step 2: 创建上传目录占位文件**

创建 `uploads/.gitkeep`:

```
# 此目录用于存储上传的文件
```

- [ ] **Step 3: 提交文件存储模块**

```bash
git add lib/storage/index.ts uploads/.gitkeep
git commit -m "feat: 添加本地文件存储模块"
```

---

### Task 5: 重写员工数据访问层

**Files:**
- Modify: `lib/db/employees.ts`

- [ ] **Step 1: 重写员工数据访问层**

重写 `lib/db/employees.ts`:

```typescript
/**
 * 员工数据服务
 */
import { db, generateId } from './index'
import type { EmployeeRow } from '@/types/db'
import type { EmployeeFormData } from '@/types/employee'

// 分页参数
export interface PaginationParams {
  page?: number
  pageSize?: number
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 员工筛选参数
export interface EmployeeFilters {
  department?: string
  status?: 'pending' | 'followed'
  search?: string
  dateFrom?: string
  dateTo?: string
}

/**
 * 获取员工列表
 */
export async function getEmployees(
  filters: EmployeeFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<EmployeeRow>> {
  const { page = 1, pageSize = 10 } = pagination
  const offset = (page - 1) * pageSize

  let whereClause = 'WHERE 1=1'
  const params: (string | number)[] = []

  if (filters.department) {
    whereClause += ' AND department = ?'
    params.push(filters.department)
  }
  if (filters.status) {
    whereClause += ' AND status = ?'
    params.push(filters.status)
  }
  if (filters.search) {
    whereClause += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)'
    const searchPattern = `%${filters.search}%`
    params.push(searchPattern, searchPattern, searchPattern)
  }
  if (filters.dateFrom) {
    whereClause += ' AND leave_date >= ?'
    params.push(filters.dateFrom)
  }
  if (filters.dateTo) {
    whereClause += ' AND leave_date <= ?'
    params.push(filters.dateTo)
  }

  // 获取总数
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM employees ${whereClause}`)
  const countResult = countStmt.get(...params) as { count: number }
  const total = countResult.count

  // 获取数据
  const dataStmt = db.prepare(`
    SELECT * FROM employees ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `)
  const data = dataStmt.all(...params, pageSize, offset) as EmployeeRow[]

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * 根据 ID 获取员工
 */
export async function getEmployeeById(id: string): Promise<EmployeeRow | null> {
  const stmt = db.prepare('SELECT * FROM employees WHERE id = ?')
  const result = stmt.get(id) as EmployeeRow | undefined
  return result || null
}

/**
 * 创建员工
 */
export async function createEmployee(
  employeeData: EmployeeFormData & { reporter_id?: string }
): Promise<EmployeeRow> {
  const id = generateId()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO employees (id, name, phone, email, department, team, position, leave_date, leave_reason, employment_duration, reporter_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `)

  stmt.run(
    id,
    employeeData.name,
    employeeData.phone || null,
    employeeData.email || null,
    employeeData.department || null,
    employeeData.team || null,
    employeeData.position || null,
    employeeData.leave_date || null,
    employeeData.leave_reason || null,
    employeeData.employment_duration || null,
    employeeData.reporter_id || null,
    now,
    now
  )

  return getEmployeeById(id) as Promise<EmployeeRow>
}

/**
 * 更新员工
 */
export async function updateEmployee(
  id: string,
  employeeData: Partial<EmployeeFormData & { status?: 'pending' | 'followed' }>
): Promise<EmployeeRow> {
  const now = new Date().toISOString()
  const updates: string[] = ['updated_at = ?']
  const params: (string | number | null)[] = [now]

  if (employeeData.name !== undefined) {
    updates.push('name = ?')
    params.push(employeeData.name)
  }
  if (employeeData.phone !== undefined) {
    updates.push('phone = ?')
    params.push(employeeData.phone || null)
  }
  if (employeeData.email !== undefined) {
    updates.push('email = ?')
    params.push(employeeData.email || null)
  }
  if (employeeData.department !== undefined) {
    updates.push('department = ?')
    params.push(employeeData.department || null)
  }
  if (employeeData.team !== undefined) {
    updates.push('team = ?')
    params.push(employeeData.team || null)
  }
  if (employeeData.position !== undefined) {
    updates.push('position = ?')
    params.push(employeeData.position || null)
  }
  if (employeeData.leave_date !== undefined) {
    updates.push('leave_date = ?')
    params.push(employeeData.leave_date || null)
  }
  if (employeeData.leave_reason !== undefined) {
    updates.push('leave_reason = ?')
    params.push(employeeData.leave_reason || null)
  }
  if (employeeData.employment_duration !== undefined) {
    updates.push('employment_duration = ?')
    params.push(employeeData.employment_duration || null)
  }
  if (employeeData.status !== undefined) {
    updates.push('status = ?')
    params.push(employeeData.status)
  }

  params.push(id)

  const stmt = db.prepare(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`)
  stmt.run(...params)

  return getEmployeeById(id) as Promise<EmployeeRow>
}

/**
 * 删除员工
 */
export async function deleteEmployee(id: string): Promise<void> {
  const stmt = db.prepare('DELETE FROM employees WHERE id = ?')
  stmt.run(id)
}

/**
 * 批量导入员工
 */
export async function importEmployees(
  employees: Array<EmployeeFormData & { reporter_id?: string }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] }

  const stmt = db.prepare(`
    INSERT INTO employees (id, name, phone, email, department, team, position, leave_date, leave_reason, employment_duration, reporter_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `)

  const insertMany = db.transaction((items: typeof employees) => {
    for (const [index, employee] of items.entries()) {
      try {
        const id = generateId()
        const now = new Date().toISOString()
        stmt.run(
          id,
          employee.name,
          employee.phone || null,
          employee.email || null,
          employee.department || null,
          employee.team || null,
          employee.position || null,
          employee.leave_date || null,
          employee.leave_reason || null,
          employee.employment_duration || null,
          employee.reporter_id || null,
          now,
          now
        )
        results.success++
      } catch (err) {
        results.failed++
        results.errors.push(`第${index + 1}行: ${(err as Error).message}`)
      }
    }
  })

  insertMany(employees)

  return results
}

/**
 * 获取员工统计数据
 */
export async function getEmployeeStats(): Promise<{
  total: number
  pending: number
  followed: number
  byDepartment: Record<string, number>
  byLeaveReason: Record<string, number>
}> {
  const stmt = db.prepare('SELECT status, department, leave_reason FROM employees')
  const rows = stmt.all() as Pick<EmployeeRow, 'status' | 'department' | 'leave_reason'>[]

  const stats = {
    total: rows.length,
    pending: 0,
    followed: 0,
    byDepartment: {} as Record<string, number>,
    byLeaveReason: {} as Record<string, number>,
  }

  for (const row of rows) {
    if (row.status === 'pending') stats.pending++
    if (row.status === 'followed') stats.followed++

    if (row.department) {
      stats.byDepartment[row.department] = (stats.byDepartment[row.department] || 0) + 1
    }

    if (row.leave_reason) {
      stats.byLeaveReason[row.leave_reason] = (stats.byLeaveReason[row.leave_reason] || 0) + 1
    }
  }

  return stats
}
```

- [ ] **Step 2: 提交员工数据访问层**

```bash
git add lib/db/employees.ts
git commit -m "refactor: 重写员工数据访问层为 SQLite 实现"
```

---

### Task 6: 重写问卷数据访问层

**Files:**
- Modify: `lib/db/questionnaires.ts`

- [ ] **Step 1: 重写问卷数据访问层**

重写 `lib/db/questionnaires.ts`:

```typescript
/**
 * 问卷数据服务
 */
import { db, generateId } from './index'
import type { QuestionnaireRow, SurveyTokenRow, SurveyResponseRow } from '@/types/db'
import type { Questionnaire, Question } from '@/types/questionnaire'

// 分页参数
interface PaginationParams {
  page?: number
  pageSize?: number
}

// 分页结果
interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 问卷筛选参数
interface QuestionnaireFilters {
  status?: 'draft' | 'active' | 'archived'
  search?: string
}

/**
 * 解析问卷数据
 */
function parseQuestionnaire(row: QuestionnaireRow): Questionnaire {
  return {
    ...row,
    questions: row.questions ? JSON.parse(row.questions) : [],
  }
}

/**
 * 获取问卷列表
 */
export async function getQuestionnaires(
  filters: QuestionnaireFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<Questionnaire>> {
  const { page = 1, pageSize = 10 } = pagination
  const offset = (page - 1) * pageSize

  let whereClause = 'WHERE 1=1'
  const params: (string | number)[] = []

  if (filters.status) {
    whereClause += ' AND status = ?'
    params.push(filters.status)
  }
  if (filters.search) {
    whereClause += ' AND title LIKE ?'
    params.push(`%${filters.search}%`)
  }

  // 获取总数
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM questionnaires ${whereClause}`)
  const countResult = countStmt.get(...params) as { count: number }
  const total = countResult.count

  // 获取数据
  const dataStmt = db.prepare(`
    SELECT * FROM questionnaires ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `)
  const rows = dataStmt.all(...params, pageSize, offset) as QuestionnaireRow[]

  return {
    data: rows.map(parseQuestionnaire),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * 根据 ID 获取问卷
 */
export async function getQuestionnaireById(id: string): Promise<Questionnaire | null> {
  const stmt = db.prepare('SELECT * FROM questionnaires WHERE id = ?')
  const row = stmt.get(id) as QuestionnaireRow | undefined
  return row ? parseQuestionnaire(row) : null
}

/**
 * 创建问卷
 */
export async function createQuestionnaire(
  questionnaireData: {
    title: string
    description?: string
    questions?: Question[]
    status?: 'draft' | 'active' | 'archived'
    external_url?: string
    external_type?: 'tencent' | null
    email_subject?: string
    email_body?: string
  }
): Promise<Questionnaire> {
  const id = generateId()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO questionnaires (id, title, description, questions, status, created_at, external_url, external_type, email_subject, email_body)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    questionnaireData.title,
    questionnaireData.description || null,
    JSON.stringify(questionnaireData.questions || []),
    questionnaireData.status || 'draft',
    now,
    questionnaireData.external_url || null,
    questionnaireData.external_type || null,
    questionnaireData.email_subject || null,
    questionnaireData.email_body || null
  )

  return getQuestionnaireById(id) as Promise<Questionnaire>
}

/**
 * 更新问卷
 */
export async function updateQuestionnaire(
  id: string,
  questionnaireData: Partial<{
    title: string
    description: string
    questions: Question[]
    status: 'draft' | 'active' | 'archived'
    external_url: string
    external_type: 'tencent' | null
    email_subject: string
    email_body: string
  }>
): Promise<Questionnaire> {
  const updates: string[] = []
  const params: (string | null)[] = []

  if (questionnaireData.title !== undefined) {
    updates.push('title = ?')
    params.push(questionnaireData.title)
  }
  if (questionnaireData.description !== undefined) {
    updates.push('description = ?')
    params.push(questionnaireData.description || null)
  }
  if (questionnaireData.questions !== undefined) {
    updates.push('questions = ?')
    params.push(JSON.stringify(questionnaireData.questions))
  }
  if (questionnaireData.status !== undefined) {
    updates.push('status = ?')
    params.push(questionnaireData.status)
  }
  if (questionnaireData.external_url !== undefined) {
    updates.push('external_url = ?')
    params.push(questionnaireData.external_url || null)
  }
  if (questionnaireData.external_type !== undefined) {
    updates.push('external_type = ?')
    params.push(questionnaireData.external_type || null)
  }
  if (questionnaireData.email_subject !== undefined) {
    updates.push('email_subject = ?')
    params.push(questionnaireData.email_subject || null)
  }
  if (questionnaireData.email_body !== undefined) {
    updates.push('email_body = ?')
    params.push(questionnaireData.email_body || null)
  }

  if (updates.length > 0) {
    params.push(id)
    const stmt = db.prepare(`UPDATE questionnaires SET ${updates.join(', ')} WHERE id = ?`)
    stmt.run(...params)
  }

  return getQuestionnaireById(id) as Promise<Questionnaire>
}

/**
 * 删除问卷
 */
export async function deleteQuestionnaire(id: string): Promise<void> {
  const stmt = db.prepare('DELETE FROM questionnaires WHERE id = ?')
  stmt.run(id)
}

/**
 * 生成问卷令牌
 */
export async function generateSurveyToken(
  employeeId: string,
  questionnaireId: string,
  expiresInDays: number = 30
): Promise<string> {
  const id = generateId()
  const token = crypto.randomUUID().replace(/-/g, '').toUpperCase()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)

  const stmt = db.prepare(`
    INSERT INTO survey_tokens (id, token, employee_id, questionnaire_id, used, expires_at, created_at)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `)

  stmt.run(id, token, employeeId, questionnaireId, expiresAt.toISOString(), now.toISOString())

  return token
}

/**
 * 验证问卷令牌
 */
export async function validateSurveyToken(
  token: string
): Promise<{ valid: boolean; employeeId?: string; questionnaireId?: string; error?: string }> {
  const stmt = db.prepare('SELECT * FROM survey_tokens WHERE token = ?')
  const row = stmt.get(token) as SurveyTokenRow | undefined

  if (!row) {
    return { valid: false, error: '无效的问卷链接' }
  }

  if (row.used === 1) {
    return { valid: false, error: '该问卷链接已使用' }
  }

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { valid: false, error: '该问卷链接已过期' }
  }

  return {
    valid: true,
    employeeId: row.employee_id || undefined,
    questionnaireId: row.questionnaire_id || undefined,
  }
}

/**
 * 提交问卷回答
 */
export async function submitSurveyResponse(
  token: string,
  answers: Record<string, string | string[]>
): Promise<void> {
  // 验证令牌
  const validation = await validateSurveyToken(token)
  if (!validation.valid) {
    throw new Error(validation.error || '无效的问卷链接')
  }

  // 获取令牌信息
  const tokenStmt = db.prepare('SELECT * FROM survey_tokens WHERE token = ?')
  const tokenRow = tokenStmt.get(token) as SurveyTokenRow

  if (!tokenRow) {
    throw new Error('获取令牌信息失败')
  }

  const now = new Date().toISOString()

  // 使用事务
  const insertResponse = db.transaction(() => {
    // 插入回答
    const id = generateId()
    const responseStmt = db.prepare(`
      INSERT INTO survey_responses (id, employee_id, questionnaire_id, answers, submit_channel, submitted_at)
      VALUES (?, ?, ?, ?, 'survey', ?)
    `)
    responseStmt.run(id, tokenRow.employee_id, tokenRow.questionnaire_id, JSON.stringify(answers), now)

    // 标记令牌已使用
    const updateTokenStmt = db.prepare('UPDATE survey_tokens SET used = 1 WHERE token = ?')
    updateTokenStmt.run(token)
  })

  insertResponse()
}

/**
 * 获取问卷回答率
 */
export async function getSurveyResponseRate(
  questionnaireId?: string
): Promise<{
  totalSent: number
  totalResponded: number
  responseRate: number
}> {
  let tokensQuery = 'SELECT * FROM survey_tokens'
  const params: string[] = []

  if (questionnaireId) {
    tokensQuery += ' WHERE questionnaire_id = ?'
    params.push(questionnaireId)
  }

  const tokensStmt = db.prepare(tokensQuery)
  const tokens = tokensStmt.all(...params) as SurveyTokenRow[]

  const totalSent = tokens.length
  const tokenResponded = tokens.filter((t) => t.used === 1).length

  // 获取手动导入的回答数量
  let responsesQuery = "SELECT COUNT(*) as count FROM survey_responses WHERE submit_channel = 'manual'"
  const responseParams: string[] = []

  if (questionnaireId) {
    responsesQuery += ' AND questionnaire_id = ?'
    responseParams.push(questionnaireId)
  }

  const responsesStmt = db.prepare(responsesQuery)
  const responsesResult = responsesStmt.get(...responseParams) as { count: number }

  const totalResponded = tokenResponded + responsesResult.count
  const responseRate = totalSent > 0 ? (totalResponded / totalSent) * 100 : 0

  return {
    totalSent,
    totalResponded,
    responseRate,
  }
}

/**
 * 获取活跃问卷列表（客户端用，返回空数组，因为客户端不再直接访问数据库）
 */
export async function getActiveQuestionnairesClient(): Promise<Questionnaire[]> {
  // 客户端不再直接访问数据库，此函数保留以保持兼容性
  return []
}
```

- [ ] **Step 2: 提交问卷数据访问层**

```bash
git add lib/db/questionnaires.ts
git commit -m "refactor: 重写问卷数据访问层为 SQLite 实现"
```

---

### Task 7: 重写回访数据访问层

**Files:**
- Modify: `lib/db/follow-ups.ts`

- [ ] **Step 1: 重写回访数据访问层**

重写 `lib/db/follow-ups.ts`:

```typescript
/**
 * 回访数据服务
 */
import { db, generateId } from './index'
import type { FollowUpPlanRow, FollowUpRecordRow, EmployeeRow } from '@/types/db'
import type { FollowUpPlan, FollowUpRecord, FollowUpRecordFormData } from '@/types/follow-up'

// 分页参数
interface PaginationParams {
  page?: number
  pageSize?: number
}

// 分页结果
interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 回访计划筛选参数
interface FollowUpFilters {
  status?: 'pending' | 'completed' | 'overdue'
  followUpType?: '1m' | '3m' | '6m' | 'custom'
  dateFrom?: string
  dateTo?: string
  employeeId?: string
}

/**
 * 获取回访计划列表
 */
export async function getFollowUpPlans(
  filters: FollowUpFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<FollowUpPlan>> {
  const { page = 1, pageSize = 10 } = pagination
  const offset = (page - 1) * pageSize

  let whereClause = 'WHERE 1=1'
  const params: (string | number)[] = []

  if (filters.status) {
    whereClause += ' AND p.status = ?'
    params.push(filters.status)
  }
  if (filters.followUpType) {
    whereClause += ' AND p.follow_up_type = ?'
    params.push(filters.followUpType)
  }
  if (filters.dateFrom) {
    whereClause += ' AND p.plan_date >= ?'
    params.push(filters.dateFrom)
  }
  if (filters.dateTo) {
    whereClause += ' AND p.plan_date <= ?'
    params.push(filters.dateTo)
  }
  if (filters.employeeId) {
    whereClause += ' AND p.employee_id = ?'
    params.push(filters.employeeId)
  }

  // 获取总数
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count FROM follow_up_plans p ${whereClause}
  `)
  const countResult = countStmt.get(...params) as { count: number }
  const total = countResult.count

  // 获取数据
  const dataStmt = db.prepare(`
    SELECT
      p.*,
      e.name as employee_name,
      e.phone as employee_phone,
      e.department as employee_department,
      e.team as employee_team,
      (SELECT created_at FROM follow_up_records WHERE plan_id = p.id LIMIT 1) as follow_up_record_created_at
    FROM follow_up_plans p
    LEFT JOIN employees e ON p.employee_id = e.id
    ${whereClause}
    ORDER BY p.plan_date ASC
    LIMIT ? OFFSET ?
  `)
  const rows = dataStmt.all(...params, pageSize, offset) as (FollowUpPlanRow & {
    employee_name: string | null
    employee_phone: string | null
    employee_department: string | null
    employee_team: string | null
    follow_up_record_created_at: string | null
  })[]

  const plans: FollowUpPlan[] = rows.map((row) => ({
    ...row,
    employee: row.employee_name
      ? {
          name: row.employee_name,
          phone: row.employee_phone,
          department: row.employee_department,
          team: row.employee_team,
        }
      : undefined,
    followUpRecordCreatedAt: row.follow_up_record_created_at,
  }))

  return {
    data: plans,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * 根据 ID 获取回访计划
 */
export async function getFollowUpPlanById(id: string): Promise<FollowUpPlan | null> {
  const stmt = db.prepare(`
    SELECT
      p.*,
      e.name as employee_name,
      e.phone as employee_phone,
      e.department as employee_department
    FROM follow_up_plans p
    LEFT JOIN employees e ON p.employee_id = e.id
    WHERE p.id = ?
  `)
  const row = stmt.get(id) as (FollowUpPlanRow & {
    employee_name: string | null
    employee_phone: string | null
    employee_department: string | null
  }) | undefined

  if (!row) return null

  return {
    ...row,
    employee: row.employee_name
      ? {
          name: row.employee_name,
          phone: row.employee_phone,
          department: row.employee_department,
        }
      : undefined,
  }
}

/**
 * 创建回访计划
 */
export async function createFollowUpPlan(
  planData: {
    employee_id: string
    plan_date: string
    follow_up_type: '1m' | '3m' | '6m' | 'custom'
  }
): Promise<FollowUpPlan> {
  const id = generateId()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO follow_up_plans (id, employee_id, plan_date, follow_up_type, status, reminder_sent, created_at)
    VALUES (?, ?, ?, ?, 'pending', 0, ?)
  `)

  stmt.run(id, planData.employee_id, planData.plan_date, planData.follow_up_type, now)

  return getFollowUpPlanById(id) as Promise<FollowUpPlan>
}

/**
 * 创建回访记录
 */
export async function createFollowUpRecord(
  planId: string,
  employeeId: string,
  recordData: FollowUpRecordFormData
): Promise<FollowUpRecord> {
  const id = generateId()
  const now = new Date().toISOString()

  const insertRecord = db.transaction(() => {
    // 创建回访记录
    const recordStmt = db.prepare(`
      INSERT INTO follow_up_records (id, plan_id, employee_id, contact_method, contact_result, new_company, new_position, salary_change, personal_feeling, suggestions, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    recordStmt.run(
      id,
      planId,
      employeeId,
      recordData.contact_method,
      recordData.contact_result,
      recordData.new_company || null,
      recordData.new_position || null,
      recordData.salary_change || null,
      recordData.personal_feeling || null,
      recordData.suggestions || null,
      now
    )

    // 更新回访计划状态
    const updatePlanStmt = db.prepare("UPDATE follow_up_plans SET status = 'completed' WHERE id = ?")
    updatePlanStmt.run(planId)

    // 更新员工状态
    const updateEmployeeStmt = db.prepare(`
      UPDATE employees SET status = 'followed', updated_at = ? WHERE id = ?
    `)
    updateEmployeeStmt.run(now, employeeId)
  })

  insertRecord()

  // 返回创建的记录
  const stmt = db.prepare('SELECT * FROM follow_up_records WHERE id = ?')
  return stmt.get(id) as FollowUpRecord
}

/**
 * 获取即将到期的回访计划
 */
export async function getUpcomingFollowUps(days: number = 7): Promise<FollowUpPlan[]> {
  const today = new Date().toISOString().split('T')[0]
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)
  const endDateStr = endDate.toISOString().split('T')[0]

  const stmt = db.prepare(`
    SELECT
      p.*,
      e.name as employee_name,
      e.phone as employee_phone,
      e.department as employee_department
    FROM follow_up_plans p
    LEFT JOIN employees e ON p.employee_id = e.id
    WHERE p.status = 'pending'
      AND p.plan_date >= ?
      AND p.plan_date <= ?
    ORDER BY p.plan_date ASC
  `)

  const rows = stmt.all(today, endDateStr) as (FollowUpPlanRow & {
    employee_name: string | null
    employee_phone: string | null
    employee_department: string | null
  })[]

  return rows.map((row) => ({
    ...row,
    employee: row.employee_name
      ? {
          name: row.employee_name,
          phone: row.employee_phone,
          department: row.employee_department,
        }
      : undefined,
  }))
}

/**
 * 获取回访统计数据
 */
export async function getFollowUpStats(): Promise<{
  total: number
  pending: number
  completed: number
  overdue: number
  byType: Record<string, number>
  byContactMethod: Record<string, number>
}> {
  const plansStmt = db.prepare('SELECT status, follow_up_type, plan_date FROM follow_up_plans')
  const plans = plansStmt.all() as Pick<FollowUpPlanRow, 'status' | 'follow_up_type' | 'plan_date'>[]

  const recordsStmt = db.prepare('SELECT contact_method FROM follow_up_records')
  const records = recordsStmt.all() as Pick<FollowUpRecordRow, 'contact_method'>[]

  const today = new Date().toISOString().split('T')[0]

  const stats = {
    total: plans.length,
    pending: 0,
    completed: 0,
    overdue: 0,
    byType: {} as Record<string, number>,
    byContactMethod: {} as Record<string, number>,
  }

  for (const plan of plans) {
    if (plan.status === 'pending') {
      if (plan.plan_date && plan.plan_date < today) {
        stats.overdue++
      } else {
        stats.pending++
      }
    } else if (plan.status === 'completed') {
      stats.completed++
    }

    if (plan.follow_up_type) {
      stats.byType[plan.follow_up_type] = (stats.byType[plan.follow_up_type] || 0) + 1
    }
  }

  for (const record of records) {
    if (record.contact_method) {
      stats.byContactMethod[record.contact_method] =
        (stats.byContactMethod[record.contact_method] || 0) + 1
    }
  }

  return stats
}

/**
 * 为员工创建默认回访计划
 */
export async function createDefaultFollowUpPlans(
  employeeId: string,
  leaveDate: string
): Promise<FollowUpPlan> {
  const leaveDateObj = new Date(leaveDate)
  const planDate = new Date(leaveDateObj)
  planDate.setMonth(planDate.getMonth() + 1)

  return createFollowUpPlan({
    employee_id: employeeId,
    plan_date: planDate.toISOString().split('T')[0],
    follow_up_type: '1m',
  })
}

/**
 * 获取员工的回访记录
 */
export async function getFollowUpRecordsByEmployee(employeeId: string): Promise<FollowUpRecord[]> {
  const stmt = db.prepare(`
    SELECT * FROM follow_up_records
    WHERE employee_id = ?
    ORDER BY created_at DESC
  `)
  return stmt.all(employeeId) as FollowUpRecord[]
}

/**
 * 客户端获取回访计划列表（保留兼容性，返回空数组）
 */
export async function getFollowUpPlansClient(
  filters: FollowUpFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<FollowUpPlan>> {
  // 客户端不再直接访问数据库
  return {
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  }
}
```

- [ ] **Step 2: 提交回访数据访问层**

```bash
git add lib/db/follow-ups.ts
git commit -m "refactor: 重写回访数据访问层为 SQLite 实现"
```

---

### Task 8: 重写报告数据访问层

**Files:**
- Modify: `lib/db/reports.ts`

- [ ] **Step 1: 重写报告数据访问层**

重写 `lib/db/reports.ts`:

```typescript
/**
 * 报告数据服务
 */
import { db, generateId } from './index'
import type { ReportRow, EmployeeRow, FollowUpRecordRow, SurveyResponseRow } from '@/types/db'
import type { Report, ReportFilters, ReportContent } from '@/types/report'

// 分页参数
interface PaginationParams {
  page?: number
  pageSize?: number
}

// 分页结果
interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 解析报告数据
 */
function parseReport(row: ReportRow): Report {
  return {
    ...row,
    filters: row.filters ? JSON.parse(row.filters) : null,
    content: row.content ? JSON.parse(row.content) : null,
  }
}

/**
 * 获取报告列表
 */
export async function getReports(
  pagination: PaginationParams = {}
): Promise<PaginatedResult<Report>> {
  const { page = 1, pageSize = 10 } = pagination
  const offset = (page - 1) * pageSize

  // 获取总数
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM reports')
  const countResult = countStmt.get() as { count: number }
  const total = countResult.count

  // 获取数据
  const dataStmt = db.prepare(`
    SELECT * FROM reports
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `)
  const rows = dataStmt.all(pageSize, offset) as ReportRow[]

  return {
    data: rows.map(parseReport),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * 根据 ID 获取报告
 */
export async function getReportById(id: string): Promise<Report | null> {
  const stmt = db.prepare('SELECT * FROM reports WHERE id = ?')
  const row = stmt.get(id) as ReportRow | undefined
  return row ? parseReport(row) : null
}

/**
 * 生成报告内容
 */
export async function generateReportContent(
  type: string,
  filters: ReportFilters = {}
): Promise<ReportContent> {
  // 构建员工查询
  let employeesQuery = 'SELECT * FROM employees WHERE 1=1'
  const params: (string | number)[] = []

  if (filters.date_from) {
    employeesQuery += ' AND leave_date >= ?'
    params.push(filters.date_from)
  }
  if (filters.date_to) {
    employeesQuery += ' AND leave_date <= ?'
    params.push(filters.date_to)
  }
  if (filters.departments && filters.departments.length > 0) {
    employeesQuery += ` AND department IN (${filters.departments.map(() => '?').join(', ')})`
    params.push(...filters.departments)
  }
  if (filters.leave_reasons && filters.leave_reasons.length > 0) {
    employeesQuery += ` AND leave_reason IN (${filters.leave_reasons.map(() => '?').join(', ')})`
    params.push(...filters.leave_reasons)
  }

  const employeesStmt = db.prepare(employeesQuery)
  const employees = employeesStmt.all(...params) as EmployeeRow[]

  // 获取回访记录
  const recordsStmt = db.prepare('SELECT * FROM follow_up_records')
  const followUpRecords = recordsStmt.all() as FollowUpRecordRow[]

  // 获取问卷回答
  const responsesStmt = db.prepare('SELECT * FROM survey_responses')
  const surveyResponses = responsesStmt.all() as SurveyResponseRow[]

  // 计算统计数据
  const totalEmployees = employees.length
  const followedEmployees = new Set(followUpRecords.map((r) => r.employee_id)).size
  const respondedEmployees = new Set(surveyResponses.map((r) => r.employee_id)).size

  const followUpRate = totalEmployees > 0 ? (followedEmployees / totalEmployees) * 100 : 0
  const surveyResponseRate = totalEmployees > 0 ? (respondedEmployees / totalEmployees) * 100 : 0

  // 统计离职原因
  const leaveReasons: Record<string, number> = {}
  for (const emp of employees) {
    if (emp.leave_reason) {
      leaveReasons[emp.leave_reason] = (leaveReasons[emp.leave_reason] || 0) + 1
    }
  }

  // 统计薪资变化
  const salaryChanges: Record<string, number> = {}
  for (const record of followUpRecords) {
    if (record.salary_change) {
      salaryChanges[record.salary_change] = (salaryChanges[record.salary_change] || 0) + 1
    }
  }

  // 统计新公司
  const companyCount: Record<string, number> = {}
  for (const record of followUpRecords) {
    if (record.new_company) {
      companyCount[record.new_company] = (companyCount[record.new_company] || 0) + 1
    }
  }

  const newCompanies = Object.entries(companyCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 收集建议
  const suggestions: string[] = []
  for (const record of followUpRecords) {
    if (record.suggestions) {
      suggestions.push(record.suggestions)
    }
  }

  return {
    summary: {
      total_employees: totalEmployees,
      follow_up_rate: Math.round(followUpRate * 100) / 100,
      survey_response_rate: Math.round(surveyResponseRate * 100) / 100,
    },
    leave_reasons,
    salary_changes: salaryChanges,
    new_companies: newCompanies,
    suggestions: suggestions.slice(0, 50),
  }
}

/**
 * 创建报告
 */
export async function createReport(
  title: string,
  type: string,
  filters: ReportFilters = {}
): Promise<Report> {
  const id = generateId()
  const now = new Date().toISOString()

  // 生成报告内容
  const content = await generateReportContent(type, filters)

  const stmt = db.prepare(`
    INSERT INTO reports (id, title, type, filters, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  stmt.run(id, title, type, JSON.stringify(filters), JSON.stringify(content), now)

  return getReportById(id) as Promise<Report>
}

/**
 * 删除报告
 */
export async function deleteReport(id: string): Promise<void> {
  const stmt = db.prepare('DELETE FROM reports WHERE id = ?')
  stmt.run(id)
}

/**
 * 获取报告统计数据
 */
export async function getReportStats(): Promise<{
  total: number
  byType: Record<string, number>
}> {
  const stmt = db.prepare('SELECT type FROM reports')
  const rows = stmt.all() as Pick<ReportRow, 'type'>[]

  const stats = {
    total: rows.length,
    byType: {} as Record<string, number>,
  }

  for (const row of rows) {
    if (row.type) {
      stats.byType[row.type] = (stats.byType[row.type] || 0) + 1
    }
  }

  return stats
}

/**
 * 导出报告为 JSON
 */
export async function exportReportAsJson(id: string): Promise<string> {
  const report = await getReportById(id)
  if (!report) {
    throw new Error('报告不存在')
  }

  return JSON.stringify(report, null, 2)
}

/**
 * 导出报告为 CSV 格式
 */
export async function exportReportAsCsv(id: string): Promise<string> {
  const report = await getReportById(id)
  if (!report) {
    throw new Error('报告不存在')
  }

  const content = report.content as unknown as ReportContent
  const rows: string[] = []

  // 添加摘要
  rows.push('摘要统计')
  rows.push('指标,数值')
  rows.push(`总离职人数,${content.summary.total_employees}`)
  rows.push(`回访率(%),${content.summary.follow_up_rate}`)
  rows.push(`问卷回答率(%),${content.summary.survey_response_rate}`)
  rows.push('')

  // 添加离职原因统计
  rows.push('离职原因统计')
  rows.push('原因,人数')
  for (const [reason, count] of Object.entries(content.leave_reasons)) {
    rows.push(`${reason},${count}`)
  }
  rows.push('')

  // 添加薪资变化统计
  rows.push('薪资变化统计')
  rows.push('变化,人数')
  for (const [change, count] of Object.entries(content.salary_changes)) {
    const label = change === 'increase' ? '涨薪' : change === 'decrease' ? '降薪' : '持平'
    rows.push(`${label},${count}`)
  }
  rows.push('')

  // 添加新公司统计
  rows.push('新公司统计')
  rows.push('公司名称,人数')
  for (const { name, count } of content.new_companies) {
    rows.push(`${name},${count}`)
  }

  return rows.join('\n')
}
```

- [ ] **Step 2: 提交报告数据访问层**

```bash
git add lib/db/reports.ts
git commit -m "refactor: 重写报告数据访问层为 SQLite 实现"
```

---

### Task 9: 修改 Middleware

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: 重写 middleware 使用本地认证**

重写 `middleware.ts`:

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const isLoggedIn = await verifySession()

  // 公开路径
  const publicPaths = ['/login', '/survey']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (!isLoggedIn && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isLoggedIn && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: 提交 middleware 修改**

```bash
git add middleware.ts
git commit -m "refactor: 修改 middleware 使用本地认证"
```

---

### Task 10: 创建登录 API

**Files:**
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`

- [ ] **Step 1: 创建登录 API**

创建 `app/api/auth/login/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { verifyCredentials, createSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: '请输入用户名和密码' },
        { status: 400 }
      )
    }

    if (!verifyCredentials(username, password)) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    await createSession()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: 创建登出 API**

创建 `app/api/auth/logout/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'

export async function POST() {
  try {
    await clearSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('登出错误:', error)
    return NextResponse.json(
      { error: '登出失败' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: 提交认证 API**

```bash
git add app/api/auth/
git commit -m "feat: 添加本地认证 API 路由"
```

---

### Task 11: 修改登录页面

**Files:**
- Modify: `app/(auth)/login/page.tsx`

- [ ] **Step 1: 重写登录页面**

重写 `app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '登录失败')
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('登录失败，请重试')
      setLoading(false)
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
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              type="text"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

- [ ] **Step 2: 提交登录页面修改**

```bash
git add app/\(auth\)/login/page.tsx
git commit -m "refactor: 修改登录页面使用本地认证 API"
```

---

### Task 12: 清理 Supabase 相关代码

**Files:**
- Delete: `lib/supabase/` 目录
- Delete: `app/api/auth/callback/route.ts`
- Delete: `types/database.ts`

- [ ] **Step 1: 删除 Supabase 目录**

```bash
rm -rf lib/supabase
```

- [ ] **Step 2: 删除 Supabase 认证回调**

```bash
rm -rf app/api/auth/callback
```

- [ ] **Step 3: 删除 Supabase 类型定义**

```bash
rm types/database.ts
```

- [ ] **Step 4: 提交删除**

```bash
git add -A
git commit -m "chore: 删除 Supabase 相关代码"
```

---

### Task 13: 更新环境变量示例

**Files:**
- Modify: `.env.example` (如果存在)
- Create: `.env.local.example`

- [ ] **Step 1: 创建环境变量示例文件**

创建 `.env.local.example`:

```env
# 管理员账户配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# 邮件服务配置 (可选)
RESEND_API_KEY=your_resend_api_key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

- [ ] **Step 2: 提交环境变量示例**

```bash
git add .env.local.example
git commit -m "docs: 添加环境变量示例文件"
```

---

### Task 14: 更新 .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: 添加数据库和上传目录到 .gitignore**

在 `.gitignore` 中添加:

```gitignore
# SQLite 数据库文件
data/*.db
data/*.db-wal
data/*.db-shm

# 上传文件
uploads/*
!uploads/.gitkeep

# 环境变量
.env.local
```

- [ ] **Step 2: 提交 .gitignore 更新**

```bash
git add .gitignore
git commit -m "chore: 更新 .gitignore 忽略数据库和上传文件"
```

---

### Task 15: 验证和测试

**Files:**
- 无文件修改

- [ ] **Step 1: 安装依赖**

```bash
npm install
```

- [ ] **Step 2: 构建项目**

```bash
npm run build
```

- [ ] **Step 3: 启动开发服务器**

```bash
npm run dev
```

- [ ] **Step 4: 测试登录功能**

1. 访问 http://localhost:3000/login
2. 使用默认账户登录: admin / admin123
3. 验证登录成功后跳转到 dashboard

- [ ] **Step 5: 测试 CRUD 功能**

1. 测试员工管理: 添加、编辑、删除员工
2. 测试问卷管理: 创建、编辑问卷
3. 测试回访管理: 创建回访计划、记录回访
4. 测试报告生成: 创建报告、导出报告

- [ ] **Step 6: 提交最终验证**

```bash
git add -A
git commit -m "test: 验证 SQLite 迁移完成"
```

---

## 完成检查清单

- [ ] 所有 Supabase 依赖已移除
- [ ] SQLite 数据库正常初始化
- [ ] 认证功能正常工作
- [ ] 员工 CRUD 正常
- [ ] 问卷 CRUD 正常
- [ ] 回访 CRUD 正常
- [ ] 报告生成正常
- [ ] 文件存储正常
- [ ] 构建无错误
- [ ] 应用可正常启动
