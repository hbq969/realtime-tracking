/**
 * 员工数据服务
 */
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type {
  Employee,
  InsertTables,
  UpdateTables,
} from '@/types/database'
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
 * 获取员工列表（服务端）
 */
export async function getEmployees(
  filters: EmployeeFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<Employee>> {
  const supabase = await createSupabaseServerClient()
  const { page = 1, pageSize = 10 } = pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('employees')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // 应用筛选
  if (filters.department) {
    query = query.eq('department', filters.department)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
  }
  if (filters.dateFrom) {
    query = query.gte('leave_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('leave_date', filters.dateTo)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new Error(`获取员工列表失败: ${error.message}`)
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * 根据ID获取员工（服务端）
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`获取员工信息失败: ${error.message}`)
  }

  return data
}

/**
 * 创建员工（服务端）
 */
export async function createEmployee(
  employeeData: EmployeeFormData & { reporter_id?: string }
): Promise<Employee> {
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny.from('employees')
    .insert({
      ...employeeData,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`创建员工失败: ${error.message}`)
  }

  return data
}

/**
 * 更新员工（服务端）
 */
export async function updateEmployee(
  id: string,
  employeeData: Partial<EmployeeFormData & { status?: 'pending' | 'followed' }>
): Promise<Employee> {
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny.from('employees')
    .update({
      ...employeeData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`更新员工失败: ${error.message}`)
  }

  return data
}

/**
 * 删除员工（服务端）
 */
export async function deleteEmployee(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('employees').delete().eq('id', id)

  if (error) {
    throw new Error(`删除员工失败: ${error.message}`)
  }
}

/**
 * 批量导入员工（服务端）
 */
export async function importEmployees(
  employees: Array<EmployeeFormData & { reporter_id?: string }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const supabase = await createSupabaseServerClient()
  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (const [index, employee] of employees.entries()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabaseAny = supabase as any
      const { error } = await supabaseAny.from('employees').insert({
        ...employee,
        status: 'pending',
      })

      if (error) {
        results.failed++
        results.errors.push(`第${index + 1}行: ${error.message}`)
      } else {
        results.success++
      }
    } catch (err) {
      results.failed++
      results.errors.push(`第${index + 1}行: ${(err as Error).message}`)
    }
  }

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
  const supabase = await createSupabaseServerClient()

  // 获取总数和状态统计
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allEmployees, error } = await (supabase as any)
    .from('employees')
    .select('status, department, leave_reason')

  if (error) {
    throw new Error(`获取员工统计失败: ${error.message}`)
  }

  const stats = {
    total: allEmployees?.length || 0,
    pending: 0,
    followed: 0,
    byDepartment: {} as Record<string, number>,
    byLeaveReason: {} as Record<string, number>,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allEmployees?.forEach((emp: any) => {
    // 状态统计
    if (emp.status === 'pending') stats.pending++
    if (emp.status === 'followed') stats.followed++

    // 部门统计
    if (emp.department) {
      stats.byDepartment[emp.department] = (stats.byDepartment[emp.department] || 0) + 1
    }

    // 离职原因统计
    if (emp.leave_reason) {
      stats.byLeaveReason[emp.leave_reason] = (stats.byLeaveReason[emp.leave_reason] || 0) + 1
    }
  })

  return stats
}

/**
 * 客户端获取员工列表
 */
export async function getEmployeesClient(
  filters: EmployeeFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<Employee>> {
  const supabase = createSupabaseBrowserClient()
  const { page = 1, pageSize = 10 } = pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('employees')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters.department) {
    query = query.eq('department', filters.department)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
  }
  if (filters.dateFrom) {
    query = query.gte('leave_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('leave_date', filters.dateTo)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new Error(`获取员工列表失败: ${error.message}`)
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}
