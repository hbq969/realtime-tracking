/**
 * 报告数据服务
 */
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import type { Report, ReportFilters, ReportContent } from '@/types/report'

type ReportRow = Database['public']['Tables']['reports']['Row']
type ReportInsert = Database['public']['Tables']['reports']['Insert']

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
 * 获取报告列表（服务端）
 */
export async function getReports(
  pagination: PaginationParams = {}
): Promise<PaginatedResult<Report>> {
  const supabase = await createSupabaseServerClient()
  const { page = 1, pageSize = 10 } = pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('reports')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error(`获取报告列表失败: ${error.message}`)
  }

  return {
    data: (data || []) as Report[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * 根据ID获取报告（服务端）
 */
export async function getReportById(id: string): Promise<Report | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`获取报告信息失败: ${error.message}`)
  }

  return data as Report
}

/**
 * 生成报告内容（服务端）
 */
export async function generateReportContent(
  type: string,
  filters: ReportFilters = {}
): Promise<ReportContent> {
  const supabase = await createSupabaseServerClient()

  // 构建员工查询
  let employeesQuery = supabase.from('employees').select('*')

  if (filters.dateFrom) {
    employeesQuery = employeesQuery.gte('leave_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    employeesQuery = employeesQuery.lte('leave_date', filters.dateTo)
  }
  if (filters.departments && filters.departments.length > 0) {
    employeesQuery = employeesQuery.in('department', filters.departments)
  }
  if (filters.leave_reasons && filters.leave_reasons.length > 0) {
    employeesQuery = employeesQuery.in('leave_reason', filters.leave_reasons)
  }

  const { data: employees, error: employeesError } = await employeesQuery

  if (employeesError) {
    throw new Error(`获取员工数据失败: ${employeesError.message}`)
  }

  // 获取回访记录
  const { data: followUpRecords, error: recordsError } = await supabase
    .from('follow_up_records')
    .select('*')

  if (recordsError) {
    throw new Error(`获取回访记录失败: ${recordsError.message}`)
  }

  // 获取问卷回答
  const { data: surveyResponses, error: responsesError } = await supabase
    .from('survey_responses')
    .select('*')

  if (responsesError) {
    throw new Error(`获取问卷回答失败: ${responsesError.message}`)
  }

  // 计算统计数据
  const totalEmployees = employees?.length || 0
  const followedEmployees = new Set(followUpRecords?.map((r) => r.employee_id)).size
  const respondedEmployees = new Set(surveyResponses?.map((r) => r.employee_id)).size

  const followUpRate = totalEmployees > 0 ? (followedEmployees / totalEmployees) * 100 : 0
  const surveyResponseRate = totalEmployees > 0 ? (respondedEmployees / totalEmployees) * 100 : 0

  // 统计离职原因
  const leaveReasons: Record<string, number> = {}
  employees?.forEach((emp) => {
    if (emp.leave_reason) {
      leaveReasons[emp.leave_reason] = (leaveReasons[emp.leave_reason] || 0) + 1
    }
  })

  // 统计薪资变化
  const salaryChanges: Record<string, number> = {}
  followUpRecords?.forEach((record) => {
    if (record.salary_change) {
      salaryChanges[record.salary_change] = (salaryChanges[record.salary_change] || 0) + 1
    }
  })

  // 统计新公司
  const companyCount: Record<string, number> = {}
  followUpRecords?.forEach((record) => {
    if (record.new_company) {
      companyCount[record.new_company] = (companyCount[record.new_company] || 0) + 1
    }
  })

  const newCompanies = Object.entries(companyCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 收集建议
  const suggestions: string[] = []
  followUpRecords?.forEach((record) => {
    if (record.suggestions) {
      suggestions.push(record.suggestions)
    }
  })

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
  const supabase = await createSupabaseServerClient()

  // 生成报告内容
  const content = await generateReportContent(type, filters)

  const { data, error } = await supabase
    .from('reports')
    .insert({
      title,
      type,
      filters: filters as unknown as Database['public']['Tables']['reports']['Insert']['filters'],
      content: content as unknown as Database['public']['Tables']['reports']['Insert']['content'],
    })
    .select()
    .single()

  if (error) {
    throw new Error(`创建报告失败: ${error.message}`)
  }

  return data as Report
}

/**
 * 删除报告（服务端）
 */
export async function deleteReport(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('reports').delete().eq('id', id)

  if (error) {
    throw new Error(`删除报告失败: ${error.message}`)
  }
}

/**
 * 获取报告统计数据（服务端）
 */
export async function getReportStats(): Promise<{
  total: number
  byType: Record<string, number>
}> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.from('reports').select('type')

  if (error) {
    throw new Error(`获取报告统计失败: ${error.message}`)
  }

  const stats = {
    total: data?.length || 0,
    byType: {} as Record<string, number>,
  }

  data?.forEach((report) => {
    if (report.type) {
      stats.byType[report.type] = (stats.byType[report.type] || 0) + 1
    }
  })

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

  const content = report.content as ReportContent
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
