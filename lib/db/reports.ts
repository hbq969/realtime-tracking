/**
 * 报告数据服务 (SQLite/sql.js 实现)
 */
import { getDb, saveDatabase, generateId } from './index'
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
 * 将数据库行转换为 Report 对象
 */
function rowToReport(row: unknown[]): Report {
  return {
    id: row[0] as string,
    title: row[1] as string,
    type: row[2] as string,
    filters: JSON.parse(row[3] as string || '{}'),
    content: JSON.parse(row[4] as string || '{}'),
    created_at: row[5] as string,
  }
}

/**
 * 获取报告列表（服务端）
 */
export async function getReports(
  pagination: PaginationParams = {}
): Promise<PaginatedResult<Report>> {
  const db = getDb()
  const { page = 1, pageSize = 10 } = pagination
  const offset = (page - 1) * pageSize

  // 查询总数
  const countResults = db.exec('SELECT COUNT(*) as count FROM reports')
  const total = countResults[0]?.values[0]?.[0] as number || 0

  // 查询数据
  const dataResults = db.exec(
    'SELECT * FROM reports ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [pageSize, offset]
  )
  const rows = dataResults[0]?.values || []
  const data = rows.map(rowToReport)

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * 根据ID获取报告（服务端）
 */
export async function getReportById(id: string): Promise<Report | null> {
  const db = getDb()

  const results = db.exec('SELECT * FROM reports WHERE id = ?', [id])
  const rows = results[0]?.values || []

  if (rows.length === 0) {
    return null
  }

  return rowToReport(rows[0])
}

/**
 * 生成报告内容（服务端）
 */
export async function generateReportContent(
  type: string,
  filters: ReportFilters = {}
): Promise<ReportContent> {
  const db = getDb()

  // 构建员工查询条件
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters.date_from) {
    conditions.push('leave_date >= ?')
    params.push(filters.date_from)
  }
  if (filters.date_to) {
    conditions.push('leave_date <= ?')
    params.push(filters.date_to)
  }
  if (filters.departments && filters.departments.length > 0) {
    const placeholders = filters.departments.map(() => '?').join(', ')
    conditions.push(`department IN (${placeholders})`)
    params.push(...filters.departments)
  }
  if (filters.leave_reasons && filters.leave_reasons.length > 0) {
    const placeholders = filters.leave_reasons.map(() => '?').join(', ')
    conditions.push(`leave_reason IN (${placeholders})`)
    params.push(...filters.leave_reasons)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 获取员工数据
  const employeesResults = db.exec(`SELECT * FROM employees ${whereClause}`, params)
  const employeesRows = employeesResults[0]?.values || []

  // 获取回访记录
  const followUpRecordsResults = db.exec('SELECT * FROM follow_up_records')
  const followUpRecordsRows = followUpRecordsResults[0]?.values || []

  // 获取问卷回答
  const surveyResponsesResults = db.exec('SELECT * FROM survey_responses')
  const surveyResponsesRows = surveyResponsesResults[0]?.values || []

  // 计算统计数据
  const totalEmployees = employeesRows.length

  // 统计已回访员工（通过 employee_id 去重）
  const followedEmployeeIds = new Set<string>()
  for (const row of followUpRecordsRows) {
    const employeeId = row[2] as string // employee_id 在第 3 列 (索引 2)
    if (employeeId) {
      followedEmployeeIds.add(employeeId)
    }
  }
  const followedEmployees = followedEmployeeIds.size

  // 统计已回答问卷员工（通过 employee_id 去重）
  const respondedEmployeeIds = new Set<string>()
  for (const row of surveyResponsesRows) {
    const employeeId = row[1] as string // employee_id 在第 2 列 (索引 1)
    if (employeeId) {
      respondedEmployeeIds.add(employeeId)
    }
  }
  const respondedEmployees = respondedEmployeeIds.size

  const followUpRate = totalEmployees > 0 ? (followedEmployees / totalEmployees) * 100 : 0
  const surveyResponseRate = totalEmployees > 0 ? (respondedEmployees / totalEmployees) * 100 : 0

  // 统计离职原因
  const leaveReasons: Record<string, number> = {}
  for (const row of employeesRows) {
    const leaveReason = row[8] as string | null // leave_reason 在第 9 列 (索引 8)
    if (leaveReason) {
      leaveReasons[leaveReason] = (leaveReasons[leaveReason] || 0) + 1
    }
  }

  // 统计薪资变化
  const salaryChanges: Record<string, number> = {}
  for (const row of followUpRecordsRows) {
    const salaryChange = row[7] as string | null // salary_change 在第 8 列 (索引 7)
    if (salaryChange) {
      salaryChanges[salaryChange] = (salaryChanges[salaryChange] || 0) + 1
    }
  }

  // 统计新公司
  const companyCount: Record<string, number> = {}
  for (const row of followUpRecordsRows) {
    const newCompany = row[5] as string | null // new_company 在第 6 列 (索引 5)
    if (newCompany) {
      companyCount[newCompany] = (companyCount[newCompany] || 0) + 1
    }
  }

  const newCompanies = Object.entries(companyCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 收集建议
  const suggestions: string[] = []
  for (const row of followUpRecordsRows) {
    const suggestion = row[9] as string | null // suggestions 在第 10 列 (索引 9)
    if (suggestion) {
      suggestions.push(suggestion)
    }
  }

  return {
    summary: {
      total_employees: totalEmployees,
      follow_up_rate: Math.round(followUpRate * 100) / 100,
      survey_response_rate: Math.round(surveyResponseRate * 100) / 100,
    },
    leave_reasons: leaveReasons,
    salary_changes: salaryChanges,
    new_companies: newCompanies,
    suggestions: suggestions.slice(0, 50), // 最多50条建议
  }
}

/**
 * 创建报告（服务端）
 */
export async function createReport(
  title: string,
  type: string,
  filters: ReportFilters = {}
): Promise<Report> {
  const db = getDb()

  // 生成报告内容
  const content = await generateReportContent(type, filters)

  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    `INSERT INTO reports (
      id, title, type, filters, content, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      title,
      type,
      JSON.stringify(filters),
      JSON.stringify(content),
      now,
    ]
  )

  saveDatabase()

  return getReportById(id) as Promise<Report>
}

/**
 * 删除报告（服务端）
 */
export async function deleteReport(id: string): Promise<void> {
  const db = getDb()

  db.run('DELETE FROM reports WHERE id = ?', [id])
  saveDatabase()
}

/**
 * 获取报告统计数据（服务端）
 */
export async function getReportStats(): Promise<{
  total: number
  byType: Record<string, number>
}> {
  const db = getDb()

  const results = db.exec('SELECT type FROM reports')
  const rows = results[0]?.values || []

  const stats = {
    total: rows.length,
    byType: {} as Record<string, number>,
  }

  for (const row of rows) {
    const type = row[0] as string | null
    if (type) {
      stats.byType[type] = (stats.byType[type] || 0) + 1
    }
  }

  return stats
}

/**
 * 导出报告为JSON（服务端）
 */
export async function exportReportAsJson(id: string): Promise<string> {
  const report = await getReportById(id)
  if (!report) {
    throw new Error('报告不存在')
  }

  return JSON.stringify(report, null, 2)
}

/**
 * 导出报告为CSV格式（服务端）
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
  Object.entries(content.leave_reasons).forEach(([reason, count]) => {
    rows.push(`${reason},${count}`)
  })
  rows.push('')

  // 添加薪资变化统计
  rows.push('薪资变化统计')
  rows.push('变化,人数')
  Object.entries(content.salary_changes).forEach(([change, count]) => {
    const label = change === 'increase' ? '涨薪' : change === 'decrease' ? '降薪' : '持平'
    rows.push(`${label},${count}`)
  })
  rows.push('')

  // 添加新公司统计
  rows.push('新公司统计')
  rows.push('公司名称,人数')
  content.new_companies.forEach(({ name, count }) => {
    rows.push(`${name},${count}`)
  })

  return rows.join('\n')
}
