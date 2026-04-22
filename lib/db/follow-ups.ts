/**
 * 回访数据服务
 */
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import type { FollowUpPlan, FollowUpRecord, FollowUpRecordFormData } from '@/types/follow-up'

type FollowUpPlanRow = Database['public']['Tables']['follow_up_plans']['Row']
type FollowUpPlanInsert = Database['public']['Tables']['follow_up_plans']['Insert']
type FollowUpPlanUpdate = Database['public']['Tables']['follow_up_plans']['Update']
type FollowUpRecordInsert = Database['public']['Tables']['follow_up_records']['Insert']

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
 * 获取回访计划列表（服务端）
 */
export async function getFollowUpPlans(
  filters: FollowUpFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<FollowUpPlan>> {
  const supabase = await createSupabaseServerClient()
  const { page = 1, pageSize = 10 } = pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('follow_up_plans')
    .select(
      `
      *,
      employees (
        name,
        phone,
        department,
        team
      ),
      follow_up_records (
        created_at
      )
    `,
      { count: 'exact' }
    )
    .order('plan_date', { ascending: true })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.followUpType) {
    query = query.eq('follow_up_type', filters.followUpType)
  }
  if (filters.dateFrom) {
    query = query.gte('plan_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('plan_date', filters.dateTo)
  }
  if (filters.employeeId) {
    query = query.eq('employee_id', filters.employeeId)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new Error(`获取回访计划失败: ${error.message}`)
  }

  // 转换数据格式
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plans = ((data || []) as any[]).map((item) => ({
    ...item,
    employee: item.employees
      ? {
          name: item.employees.name,
          phone: item.employees.phone,
          department: item.employees.department,
          team: item.employees.team,
        }
      : undefined,
    followUpRecordCreatedAt: item.follow_up_records?.[0]?.created_at || null,
  })) as FollowUpPlan[]

  return {
    data: plans,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * 根据ID获取回访计划（服务端）
 */
export async function getFollowUpPlanById(id: string): Promise<FollowUpPlan | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('follow_up_plans')
    .select(
      `
      *,
      employees (
        name,
        phone,
        department
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`获取回访计划失败: ${error.message}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    ...(data as any),
    employee: (data as any).employees
      ? {
          name: (data as any).employees.name,
          phone: (data as any).employees.phone,
          department: (data as any).employees.department,
        }
      : undefined,
  } as FollowUpPlan
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
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('follow_up_plans')
    .insert({
      ...planData,
      status: 'pending',
      reminder_sent: false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`创建回访计划失败: ${error.message}`)
  }

  return data as FollowUpPlan
}

/**
 * 创建回访记录（服务端）
 */
export async function createFollowUpRecord(
  planId: string,
  employeeId: string,
  recordData: FollowUpRecordFormData
): Promise<FollowUpRecord> {
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any

  // 创建回访记录
  const { data, error } = await supabaseAny
    .from('follow_up_records')
    .insert({
      plan_id: planId,
      employee_id: employeeId,
      contact_method: recordData.contact_method,
      contact_result: recordData.contact_result,
      new_company: recordData.new_company || null,
      new_position: recordData.new_position || null,
      salary_change: recordData.salary_change || null,
      personal_feeling: recordData.personal_feeling || null,
      suggestions: recordData.suggestions || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`创建回访记录失败: ${error.message}`)
  }

  // 更新回访计划状态
  const { error: updateError } = await supabaseAny
    .from('follow_up_plans')
    .update({ status: 'completed' })
    .eq('id', planId)

  if (updateError) {
    throw new Error(`更新回访计划状态失败: ${updateError.message}`)
  }

  // 更新员工状态
  const { error: employeeUpdateError } = await supabaseAny
    .from('employees')
    .update({ status: 'followed', updated_at: new Date().toISOString() })
    .eq('id', employeeId)

  if (employeeUpdateError) {
    throw new Error(`更新员工状态失败: ${employeeUpdateError.message}`)
  }

  return data as unknown as FollowUpRecord
}

/**
 * 获取即将到期的回访计划（服务端）
 */
export async function getUpcomingFollowUps(
  days: number = 7
): Promise<FollowUpPlan[]> {
  const supabase = await createSupabaseServerClient()
  const today = new Date()
  const endDate = new Date()
  endDate.setDate(today.getDate() + days)

  const { data, error } = await supabase
    .from('follow_up_plans')
    .select(
      `
      *,
      employees (
        name,
        phone,
        department
      )
    `
    )
    .eq('status', 'pending')
    .gte('plan_date', today.toISOString().split('T')[0])
    .lte('plan_date', endDate.toISOString().split('T')[0])
    .order('plan_date', { ascending: true })

  if (error) {
    throw new Error(`获取即将到期的回访计划失败: ${error.message}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data || []) as any[]).map((item) => ({
    ...item,
    employee: item.employees
      ? {
          name: item.employees.name,
          phone: item.employees.phone,
          department: item.employees.department,
        }
      : undefined,
  })) as FollowUpPlan[]
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
  const supabase = await createSupabaseServerClient()

  // 获取计划统计
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: plans, error: plansError } = await (supabase as any)
    .from('follow_up_plans')
    .select('status, follow_up_type, plan_date')

  if (plansError) {
    throw new Error(`获取回访计划统计失败: ${plansError.message}`)
  }

  // 获取记录统计
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: records, error: recordsError } = await (supabase as any)
    .from('follow_up_records')
    .select('contact_method')

  if (recordsError) {
    throw new Error(`获取回访记录统计失败: ${recordsError.message}`)
  }

  const today = new Date().toISOString().split('T')[0]
  const stats = {
    total: plans?.length || 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    byType: {} as Record<string, number>,
    byContactMethod: {} as Record<string, number>,
  }

  // 统计计划状态
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plans?.forEach((plan: any) => {
    if (plan.status === 'pending') {
      // 检查是否逾期
      const planDate = plan.plan_date
      if (planDate && planDate < today) {
        stats.overdue++
      } else {
        stats.pending++
      }
    } else if (plan.status === 'completed') {
      stats.completed++
    }

    // 按类型统计
    if (plan.follow_up_type) {
      stats.byType[plan.follow_up_type] = (stats.byType[plan.follow_up_type] || 0) + 1
    }
  })

  // 统计联系方式
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  records?.forEach((record: any) => {
    if (record.contact_method) {
      stats.byContactMethod[record.contact_method] =
        (stats.byContactMethod[record.contact_method] || 0) + 1
    }
  })

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
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('follow_up_records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`获取员工回访记录失败: ${error.message}`)
  }

  return (data || []) as unknown as FollowUpRecord[]
}

/**
 * 客户端获取回访计划列表
 */
export async function getFollowUpPlansClient(
  filters: FollowUpFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<FollowUpPlan>> {
  const supabase = createSupabaseBrowserClient()
  const { page = 1, pageSize = 10 } = pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('follow_up_plans')
    .select(
      `
      *,
      employees (
        name,
        phone,
        department,
        team
      )
    `,
      { count: 'exact' }
    )
    .order('plan_date', { ascending: true })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.followUpType) {
    query = query.eq('follow_up_type', filters.followUpType)
  }
  if (filters.dateFrom) {
    query = query.gte('plan_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('plan_date', filters.dateTo)
  }
  if (filters.employeeId) {
    query = query.eq('employee_id', filters.employeeId)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new Error(`获取回访计划失败: ${error.message}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plans = ((data || []) as any[]).map((item) => ({
    ...item,
    employee: item.employees
      ? {
          name: item.employees.name,
          phone: item.employees.phone,
          department: item.employees.department,
        }
      : undefined,
  })) as FollowUpPlan[]

  return {
    data: plans,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}
