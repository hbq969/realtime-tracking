/**
 * 员工数据服务 (SQLite/sql.js 实现)
 */
import { getDb, saveDatabase, generateId } from './index'
import type { EmployeeFormData } from '@/types/employee'

// SQL 参数类型
type SqlParam = string | number | null | Uint8Array

// 员工类型定义
export interface Employee {
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
 * 将数据库行转换为 Employee 对象
 */
function rowToEmployee(row: unknown[]): Employee {
  return {
    id: row[0] as string,
    name: row[1] as string,
    phone: row[2] as string | null,
    email: row[3] as string | null,
    department: row[4] as string | null,
    team: row[5] as string | null,
    position: row[6] as string | null,
    leave_date: row[7] as string | null,
    leave_reason: row[8] as string | null,
    employment_duration: row[9] as number | null,
    reporter_id: row[10] as string | null,
    status: row[11] as 'pending' | 'followed',
    created_at: row[12] as string,
    updated_at: row[13] as string,
  }
}

/**
 * 获取员工列表（服务端）
 */
export async function getEmployees(
  filters: EmployeeFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<Employee>> {
  const db = await getDb()
  const { page = 1, pageSize = 10 } = pagination
  const offset = (page - 1) * pageSize

  // 构建 WHERE 子句
  const conditions: string[] = []
  const params: SqlParam[] = []

  if (filters.department) {
    conditions.push('department = ?')
    params.push(filters.department)
  }
  if (filters.status) {
    conditions.push('status = ?')
    params.push(filters.status)
  }
  if (filters.search) {
    conditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)')
    const searchPattern = `%${filters.search}%`
    params.push(searchPattern, searchPattern, searchPattern)
  }
  if (filters.dateFrom) {
    conditions.push('leave_date >= ?')
    params.push(filters.dateFrom)
  }
  if (filters.dateTo) {
    conditions.push('leave_date <= ?')
    params.push(filters.dateTo)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 查询总数
  const countSql = `SELECT COUNT(*) as count FROM employees ${whereClause}`
  const countResults = db.exec(countSql, params)
  const total = countResults[0]?.values[0]?.[0] as number || 0

  // 查询数据
  const dataSql = `SELECT * FROM employees ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  const dataResults = db.exec(dataSql, [...params, pageSize, offset])
  const rows = dataResults[0]?.values || []
  const data = rows.map(rowToEmployee)

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * 根据ID获取员工（服务端）
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  const db = await getDb()

  const results = db.exec('SELECT * FROM employees WHERE id = ?', [id])
  const rows = results[0]?.values || []

  if (rows.length === 0) {
    return null
  }

  return rowToEmployee(rows[0])
}

/**
 * 创建员工（服务端）
 */
export async function createEmployee(
  employeeData: EmployeeFormData & { reporter_id?: string }
): Promise<Employee> {
  const db = await getDb()
  const id = generateId()
  const now = new Date().toISOString()

  db.run(
    `INSERT INTO employees (
      id, name, phone, email, department, team, position,
      leave_date, leave_reason, employment_duration, reporter_id, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
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
      'pending',
      now,
      now,
    ]
  )

  saveDatabase()

  return getEmployeeById(id) as Promise<Employee>
}

/**
 * 更新员工（服务端）
 */
export async function updateEmployee(
  id: string,
  employeeData: Partial<EmployeeFormData & { status?: 'pending' | 'followed' }>
): Promise<Employee> {
  const db = await getDb()
  const now = new Date().toISOString()

  // 构建更新字段
  const updates: string[] = ['updated_at = ?']
  const params: SqlParam[] = [now]

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

  db.run(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`, params)
  saveDatabase()

  const employee = await getEmployeeById(id)
  if (!employee) {
    throw new Error('更新员工失败: 员工不存在')
  }

  return employee
}

/**
 * 删除员工（服务端）
 */
export async function deleteEmployee(id: string): Promise<void> {
  const db = await getDb()

  db.run('DELETE FROM employees WHERE id = ?', [id])
  saveDatabase()
}

/**
 * 批量导入员工（服务端）
 */
export async function importEmployees(
  employees: Array<EmployeeFormData & { reporter_id?: string }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const db = await getDb()
  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (const [index, employee] of employees.entries()) {
    try {
      const id = generateId()
      const now = new Date().toISOString()

      db.run(
        `INSERT INTO employees (
          id, name, phone, email, department, team, position,
          leave_date, leave_reason, employment_duration, reporter_id, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
          'pending',
          now,
          now,
        ]
      )

      results.success++
    } catch (err) {
      results.failed++
      results.errors.push(`第${index + 1}行: ${(err as Error).message}`)
    }
  }

  saveDatabase()

  return results
}

/**
 * 获取员工统计数据（服务端）
 */
export async function getEmployeeStats(): Promise<{
  total: number
  pending: number
  followed: number
  byDepartment: Record<string, number>
  byLeaveReason: Record<string, number>
}> {
  const db = await getDb()

  const results = db.exec('SELECT status, department, leave_reason FROM employees')
  const rows = results[0]?.values || []

  const stats = {
    total: rows.length,
    pending: 0,
    followed: 0,
    byDepartment: {} as Record<string, number>,
    byLeaveReason: {} as Record<string, number>,
  }

  for (const row of rows) {
    const status = row[0] as string
    const department = row[1] as string | null
    const leaveReason = row[2] as string | null

    // 状态统计
    if (status === 'pending') stats.pending++
    if (status === 'followed') stats.followed++

    // 部门统计
    if (department) {
      stats.byDepartment[department] = (stats.byDepartment[department] || 0) + 1
    }

    // 离职原因统计
    if (leaveReason) {
      stats.byLeaveReason[leaveReason] = (stats.byLeaveReason[leaveReason] || 0) + 1
    }
  }

  return stats
}

/**
 * 客户端获取员工列表 (通过 API 调用)
 * 注：SQLite 不支持直接客户端访问，需要通过 API
 */
export async function getEmployeesClient(
  filters: EmployeeFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<Employee>> {
  // 通过 API 路由获取数据
  const params = new URLSearchParams()
  if (filters.department) params.set('department', filters.department)
  if (filters.status) params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  if (pagination.page) params.set('page', String(pagination.page))
  if (pagination.pageSize) params.set('pageSize', String(pagination.pageSize))

  const response = await fetch(`/api/employees?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`获取员工列表失败: ${response.statusText}`)
  }

  return response.json()
}
