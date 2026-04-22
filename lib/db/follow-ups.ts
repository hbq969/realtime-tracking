/**
 * 回访数据服务 (SQLite/sql.js 实现)
 */
import { getDb, saveDatabase, generateId } from './index'
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
 * 将数据库行转换为 FollowUpPlan 对象
 */
function rowToFollowUpPlan(row: unknown[]): FollowUpPlan {
  return {
    id: row[0] as string,
    employee_id: row[1] as string,
    plan_date: row[2] as string,
    follow_up_type: row[3] as '1m' | '3m' | '6m' | 'custom',
    status: row[4] as 'pending' | 'completed' | 'overdue',
    reminder_sent: row[5] === 1,
    created_at: row[6] as string,
  }
}

/**
 * 将数据库行转换为 FollowUpRecord 对象
 */
function rowToFollowUpRecord(row: unknown[]): FollowUpRecord {
  return {
    id: row[0] as string,
    plan_id: row[1] as string,
    employee_id: row[2] as string,
    contact_method: row[3] as 'phone' | 'wechat' | 'email',
    contact_result: row[4] as 'connected' | 'no_answer' | 'refused',
    new_company: row[5] as string,
    new_position: row[6] as string,
    salary_change: row[7] as 'increase' | 'decrease' | 'same',
    personal_feeling: row[8] as string,
    suggestions: row[9] as string,
    created_at: row[10] as string,
  }
}

/**
 * 获取回访计划列表（服务端）
 */
export async function getFollowUpPlans(
  filters: FollowUpFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<FollowUpPlan>> {
  const db = getDb()
  const { page = 1, pageSize = 10 } = pagination
  const offset = (page - 1) * pageSize

  // 构建 WHERE 子句
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters.status) {
    conditions.push('status = ?')
    params.push(filters.status)
  }
  if (filters.followUpType) {
    conditions.push('follow_up_type = ?')
    params.push(filters.followUpType)
  }
  if (filters.dateFrom) {
    conditions.push('plan_date >= ?')
    params.push(filters.dateFrom)
  }
  if (filters.dateTo) {
    conditions.push('plan_date <= ?')
    params.push(filters.dateTo)
  }
  if (filters.employeeId) {
    conditions.push('employee_id = ?')
    params.push(filters.employeeId)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 查询总数
  const countSql = `SELECT COUNT(*) as count FROM follow_up_plans ${whereClause}`
  const countResults = db.exec(countSql, params)
  const total = countResults[0]?.values[0]?.[0] as number || 0

  // 查询数据
  const dataSql = `SELECT * FROM follow_up_plans ${whereClause} ORDER BY plan_date ASC LIMIT ? OFFSET ?`
  const dataResults = db.exec(dataSql, [...params, pageSize, offset])
  const rows = dataResults[0]?.values || []
  const plans = rows.map(rowToFollowUpPlan)

  // 查询关联的员工信息
  for (const plan of plans) {
    const employeeResults = db.exec(
      'SELECT name, phone, department, team FROM employees WHERE id = ?',
      [plan.employee_id]
    )
    const employeeRow = employeeResults[0]?.values?.[0]
    if (employeeRow) {
      plan.employee = {
        name: employeeRow[0] as string,
        phone: employeeRow[1] as string,
        department: employeeRow[2] as string,
        team: employeeRow[3] as string | undefined,
      }
    }

    // 查询回访记录创建时间
    const recordResults = db.exec(
      'SELECT created_at FROM follow_up_records WHERE plan_id = ? LIMIT 1',
      [plan.id]
    )
    const recordRow = recordResults[0]?.values?.[0]
    if (recordRow) {
      plan.followUpRecordCreatedAt = recordRow[0] as string
    }
  }

  return {
    data: plans,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * 根据ID获取回访计划（服务端）
 */
export async function getFollowUpPlanById(id: string): Promise<FollowUpPlan | null> {
  const db = getDb()

  const results = db.exec('SELECT * FROM follow_up_plans WHERE id = ?', [id])
  const rows = results[0]?.values || []

  if (rows.length === 0) {
    return null
  }

  const plan = rowToFollowUpPlan(rows[0])

  // 查询关联的员工信息
  const employeeResults = db.exec(
    'SELECT name, phone, department FROM employees WHERE id = ?',
    [plan.employee_id]
  )
  const employeeRow = employeeResults[0]?.values?.[0]
  if (employeeRow) {
    plan.employee = {
      name: employeeRow[0] as string,
      phone: employeeRow[1] as string,
      department: employeeRow[2] as string,
    }
  }

  return plan
}

/**
 * 创建回访计划（服务端）
 */
export async function createFollowUpPlan(
  planData: {
    employee_id: string
    plan_date: string
    follow_up_type: '1m' | '3m' | '6m' | 'custom'
  }
): Promise<FollowUpPlan> {
  const db = getDb()
  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    `INSERT INTO follow_up_plans (
      id, employee_id, plan_date, follow_up_type, status, reminder_sent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      planData.employee_id,
      planData.plan_date,
      planData.follow_up_type,
      'pending',
      0,
      now,
    ]
  )

  saveDatabase()

  return getFollowUpPlanById(id) as Promise<FollowUpPlan>
}

/**
 * 创建回访记录（服务端）
 */
export async function createFollowUpRecord(
  planId: string,
  employeeId: string,
  recordData: FollowUpRecordFormData
): Promise<FollowUpRecord> {
  const db = getDb()

  // 创建回访记录
  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    `INSERT INTO follow_up_records (
      id, plan_id, employee_id, contact_method, contact_result,
      new_company, new_position, salary_change, personal_feeling, suggestions, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
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
      now,
    ]
  )

  // 更新回访计划状态
  db.run('UPDATE follow_up_plans SET status = ? WHERE id = ?', ['completed', planId])

  // 更新员工状态
  db.run('UPDATE employees SET status = ?, updated_at = ? WHERE id = ?', ['followed', now, employeeId])

  saveDatabase()

  // 返回新创建的记录
  const results = db.exec('SELECT * FROM follow_up_records WHERE id = ?', [id])
  const rows = results[0]?.values || []

  if (rows.length === 0) {
    throw new Error('创建回访记录失败: 无法获取创建的记录')
  }

  return rowToFollowUpRecord(rows[0])
}

/**
 * 获取即将到期的回访计划（服务端）
 */
export async function getUpcomingFollowUps(
  days: number = 7
): Promise<FollowUpPlan[]> {
  const db = getDb()
  const today = new Date().toISOString().split('T')[0]
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)
  const endDateStr = endDate.toISOString().split('T')[0]

  const results = db.exec(
    `SELECT * FROM follow_up_plans
     WHERE status = 'pending'
     AND plan_date >= ?
     AND plan_date <= ?
     ORDER BY plan_date ASC`,
    [today, endDateStr]
  )

  const rows = results[0]?.values || []
  const plans = rows.map(rowToFollowUpPlan)

  // 查询关联的员工信息
  for (const plan of plans) {
    const employeeResults = db.exec(
      'SELECT name, phone, department FROM employees WHERE id = ?',
      [plan.employee_id]
    )
    const employeeRow = employeeResults[0]?.values?.[0]
    if (employeeRow) {
      plan.employee = {
        name: employeeRow[0] as string,
        phone: employeeRow[1] as string,
        department: employeeRow[2] as string,
      }
    }
  }

  return plans
}

/**
 * 获取回访统计数据（服务端）
 */
export async function getFollowUpStats(): Promise<{
  total: number
  pending: number
  completed: number
  overdue: number
  byType: Record<string, number>
  byContactMethod: Record<string, number>
}> {
  const db = getDb()

  // 获取所有计划
  const plansResults = db.exec('SELECT status, follow_up_type, plan_date FROM follow_up_plans')
  const plansRows = plansResults[0]?.values || []

  // 获取所有记录的联系方式
  const recordsResults = db.exec('SELECT contact_method FROM follow_up_records')
  const recordsRows = recordsResults[0]?.values || []

  const today = new Date().toISOString().split('T')[0]
  const stats = {
    total: plansRows.length,
    pending: 0,
    completed: 0,
    overdue: 0,
    byType: {} as Record<string, number>,
    byContactMethod: {} as Record<string, number>,
  }

  // 统计计划状态
  for (const row of plansRows) {
    const status = row[0] as string
    const followUpType = row[1] as string | null
    const planDate = row[2] as string | null

    if (status === 'pending') {
      // 检查是否逾期
      if (planDate && planDate < today) {
        stats.overdue++
      } else {
        stats.pending++
      }
    } else if (status === 'completed') {
      stats.completed++
    }

    // 按类型统计
    if (followUpType) {
      stats.byType[followUpType] = (stats.byType[followUpType] || 0) + 1
    }
  }

  // 统计联系方式
  for (const row of recordsRows) {
    const contactMethod = row[0] as string | null
    if (contactMethod) {
      stats.byContactMethod[contactMethod] = (stats.byContactMethod[contactMethod] || 0) + 1
    }
  }

  return stats
}

/**
 * 为员工创建默认回访计划（服务端）
 * 每个员工只创建一条回访记录
 */
export async function createDefaultFollowUpPlans(
  employeeId: string,
  leaveDate: string
): Promise<FollowUpPlan> {
  const leaveDateObj = new Date(leaveDate)

  // 默认离职后1个月回访
  const planDate = new Date(leaveDateObj)
  planDate.setMonth(planDate.getMonth() + 1)

  const plan = await createFollowUpPlan({
    employee_id: employeeId,
    plan_date: planDate.toISOString().split('T')[0],
    follow_up_type: '1m',
  })

  return plan
}

/**
 * 获取员工的回访记录（服务端）
 */
export async function getFollowUpRecordsByEmployee(
  employeeId: string
): Promise<FollowUpRecord[]> {
  const db = getDb()

  const results = db.exec(
    'SELECT * FROM follow_up_records WHERE employee_id = ? ORDER BY created_at DESC',
    [employeeId]
  )

  const rows = results[0]?.values || []
  return rows.map(rowToFollowUpRecord)
}

/**
 * 客户端获取回访计划列表
 * 注：SQLite 不支持直接客户端访问，返回空结果
 */
export async function getFollowUpPlansClient(
  filters: FollowUpFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<FollowUpPlan>> {
  // SQLite 实现不支持客户端直接访问，需要通过 API
  // 返回空结果
  return {
    data: [],
    total: 0,
    page: pagination.page || 1,
    pageSize: pagination.pageSize || 10,
    totalPages: 0,
  }
}
