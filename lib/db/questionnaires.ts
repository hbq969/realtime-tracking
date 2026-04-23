/**
 * 问卷数据服务 (SQLite/sql.js 实现)
 */
import { getDb, saveDatabase, generateId } from './index'
import type { Questionnaire, Question, ExternalType } from '@/types/questionnaire'

// SQL 参数类型
type SqlParam = string | number | null | Uint8Array

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
 * 将数据库行转换为 Questionnaire 对象
 */
function rowToQuestionnaire(row: unknown[]): Questionnaire {
  return {
    id: row[0] as string,
    title: row[1] as string,
    description: row[2] as string,
    questions: row[3] ? JSON.parse(row[3] as string) : null,
    status: row[4] as 'draft' | 'active' | 'archived',
    created_at: row[5] as string,
    external_url: row[6] as string | null,
    external_type: row[7] as ExternalType,
    email_subject: row[8] as string | null,
    email_body: row[9] as string | null,
  }
}

/**
 * 获取问卷列表（服务端）
 */
export async function getQuestionnaires(
  filters: QuestionnaireFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<Questionnaire>> {
  const db = await getDb()
  const { page = 1, pageSize = 10 } = pagination
  const offset = (page - 1) * pageSize

  // 构建 WHERE 子句
  const conditions: string[] = []
  const params: SqlParam[] = []

  if (filters.status) {
    conditions.push('status = ?')
    params.push(filters.status)
  }
  if (filters.search) {
    conditions.push('title LIKE ?')
    params.push(`%${filters.search}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 查询总数
  const countSql = `SELECT COUNT(*) as count FROM questionnaires ${whereClause}`
  const countResults = db.exec(countSql, params)
  const total = countResults[0]?.values[0]?.[0] as number || 0

  // 查询数据
  const dataSql = `SELECT * FROM questionnaires ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  const dataResults = db.exec(dataSql, [...params, pageSize, offset])
  const rows = dataResults[0]?.values || []
  const data = rows.map(rowToQuestionnaire)

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * 根据ID获取问卷（服务端）
 */
export async function getQuestionnaireById(id: string): Promise<Questionnaire | null> {
  const db = await getDb()

  const results = db.exec('SELECT * FROM questionnaires WHERE id = ?', [id])
  const rows = results[0]?.values || []

  if (rows.length === 0) {
    return null
  }

  return rowToQuestionnaire(rows[0])
}

/**
 * 创建问卷（服务端）
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
  const db = await getDb()
  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    `INSERT INTO questionnaires (
      id, title, description, questions, status, created_at, external_url, external_type, email_subject, email_body
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      questionnaireData.title,
      questionnaireData.description || null,
      questionnaireData.questions ? JSON.stringify(questionnaireData.questions) : null,
      questionnaireData.status || 'draft',
      now,
      questionnaireData.external_url || null,
      questionnaireData.external_type || null,
      questionnaireData.email_subject || null,
      questionnaireData.email_body || null,
    ]
  )

  saveDatabase()

  return getQuestionnaireById(id) as Promise<Questionnaire>
}

/**
 * 更新问卷（服务端）
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
  const db = await getDb()

  // 构建更新字段
  const updates: string[] = []
  const params: SqlParam[] = []

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
    params.push(questionnaireData.questions ? JSON.stringify(questionnaireData.questions) : null)
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

  if (updates.length === 0) {
    const questionnaire = await getQuestionnaireById(id)
    if (!questionnaire) {
      throw new Error('更新问卷失败: 问卷不存在')
    }
    return questionnaire
  }

  params.push(id)

  db.run(`UPDATE questionnaires SET ${updates.join(', ')} WHERE id = ?`, params)
  saveDatabase()

  const questionnaire = await getQuestionnaireById(id)
  if (!questionnaire) {
    throw new Error('更新问卷失败: 问卷不存在')
  }

  return questionnaire
}

/**
 * 删除问卷（服务端）
 */
export async function deleteQuestionnaire(id: string): Promise<void> {
  const db = await getDb()

  db.run('DELETE FROM questionnaires WHERE id = ?', [id])
  saveDatabase()
}

/**
 * 生成问卷令牌（服务端）
 */
export async function generateSurveyToken(
  employeeId: string,
  questionnaireId: string,
  expiresInDays: number = 30
): Promise<string> {
  const db = await getDb()

  // 生成随机令牌
  const token = crypto.randomUUID().replace(/-/g, '').toUpperCase()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    `INSERT INTO survey_tokens (id, token, employee_id, questionnaire_id, used, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, token, employeeId, questionnaireId, 0, expiresAt.toISOString(), now]
  )

  saveDatabase()

  return token
}

/**
 * 验证问卷令牌（服务端）
 */
export async function validateSurveyToken(
  token: string
): Promise<{ valid: boolean; employeeId?: string; questionnaireId?: string; error?: string }> {
  const db = await getDb()

  const results = db.exec(
    'SELECT * FROM survey_tokens WHERE token = ?',
    [token]
  )

  const rows = results[0]?.values || []

  if (rows.length === 0) {
    return { valid: false, error: '无效的问卷链接' }
  }

  const row = rows[0]
  const used = row[4] as number
  const expiresAt = row[5] as string
  const employeeId = row[2] as string
  const questionnaireId = row[3] as string

  if (used === 1) {
    return { valid: false, error: '该问卷链接已使用' }
  }

  if (expiresAt && new Date(expiresAt) < new Date()) {
    return { valid: false, error: '该问卷链接已过期' }
  }

  return {
    valid: true,
    employeeId: employeeId || undefined,
    questionnaireId: questionnaireId || undefined,
  }
}

/**
 * 提交问卷回答（服务端）
 */
export async function submitSurveyResponse(
  token: string,
  answers: Record<string, string | string[]>
): Promise<void> {
  const db = await getDb()

  // 验证令牌
  const validation = await validateSurveyToken(token)
  if (!validation.valid) {
    throw new Error(validation.error || '无效的问卷链接')
  }

  // 获取令牌信息
  const tokenResults = db.exec(
    'SELECT * FROM survey_tokens WHERE token = ?',
    [token]
  )
  const tokenRows = tokenResults[0]?.values || []

  if (tokenRows.length === 0) {
    throw new Error('获取令牌信息失败')
  }

  const tokenData = tokenRows[0]
  const employeeId = tokenData[2] as string
  const questionnaireId = tokenData[3] as string

  // 插入回答
  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    `INSERT INTO survey_responses (id, employee_id, questionnaire_id, answers, submit_channel, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, employeeId, questionnaireId, JSON.stringify(answers), 'survey', now]
  )

  // 标记令牌已使用
  db.run('UPDATE survey_tokens SET used = 1 WHERE token = ?', [token])

  saveDatabase()
}

/**
 * 获取问卷回答率（服务端）
 */
export async function getSurveyResponseRate(
  questionnaireId?: string
): Promise<{
  totalSent: number
  totalResponded: number
  responseRate: number
}> {
  const db = await getDb()

  const whereClause = questionnaireId ? 'WHERE questionnaire_id = ?' : ''
  const params: SqlParam[] = questionnaireId ? [questionnaireId] : []

  // 分母：被发送过问卷的离职员工数（按 employee_id 去重）
  const sentSql = `SELECT COUNT(DISTINCT employee_id) as count FROM survey_tokens ${whereClause}`
  const sentResults = db.exec(sentSql, params)
  const totalSent = sentResults[0]?.values[0]?.[0] as number || 0

  // 分子：有回答的离职员工数（按 employee_id 去重）
  const respondedSql = `SELECT COUNT(DISTINCT employee_id) as count FROM survey_responses ${whereClause}`
  const respondedResults = db.exec(respondedSql, params)
  const totalResponded = respondedResults[0]?.values[0]?.[0] as number || 0

  const responseRate = totalSent > 0 ? (totalResponded / totalSent) * 100 : 0

  return {
    totalSent,
    totalResponded,
    responseRate,
  }
}

/**
 * 获取活跃问卷（客户端）
 * 注：SQLite 不支持直接客户端访问，返回空数组
 */
export async function getActiveQuestionnairesClient(): Promise<Questionnaire[]> {
  // SQLite 实现不支持客户端直接访问，需要通过 API
  // 返回空数组或抛出错误提示使用 API
  return []
}
