/**
 * SQLite 数据库初始化和连接 (sql.js 实现)
 */
import initSqlJs, { Database, SqlJsStatic } from 'sql.js'
import path from 'path'
import fs from 'fs'

let db: Database | null = null
let SQL: SqlJsStatic | null = null
let initPromise: Promise<Database> | null = null

// 数据库文件路径
const dataDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'realtime-tracking.db')

/**
 * 初始化数据库
 */
export async function initDatabase(): Promise<Database> {
  // 如果已经初始化，直接返回
  if (db) return db

  // 如果正在初始化，等待初始化完成
  if (initPromise) return initPromise

  initPromise = (async () => {
    // 确保数据目录存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // 初始化 sql.js，指定 WASM 文件路径
    SQL = await initSqlJs({
      locateFile: (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
    })

    // 尝试加载现有数据库
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath)
      db = new SQL.Database(buffer)
    } else {
      db = new SQL.Database()
    }

    // 创建表
    db.run(`
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
    `)

    // 创建索引
    db.run('CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status)')
    db.run('CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department)')
    db.run('CREATE INDEX IF NOT EXISTS idx_survey_tokens_token ON survey_tokens(token)')
    db.run('CREATE INDEX IF NOT EXISTS idx_follow_up_plans_status ON follow_up_plans(status)')
    db.run('CREATE INDEX IF NOT EXISTS idx_follow_up_plans_employee ON follow_up_plans(employee_id)')
    db.run('CREATE INDEX IF NOT EXISTS idx_follow_up_records_employee ON follow_up_records(employee_id)')
    db.run('CREATE INDEX IF NOT EXISTS idx_survey_responses_employee ON survey_responses(employee_id)')

    // 保存到文件
    saveDatabase()

    return db
  })()

  return initPromise
}

/**
 * 保存数据库到文件
 */
export function saveDatabase(): void {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  }
}

/**
 * 获取数据库实例（自动初始化）
 */
export async function getDb(): Promise<Database> {
  if (db) return db
  return initDatabase()
}

/**
 * 生成 UUID
 */
export function generateId(): string {
  return crypto.randomUUID()
}
