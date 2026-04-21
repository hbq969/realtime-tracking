/**
 * 问卷数据服务
 */
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import type { Questionnaire, Question } from '@/types/questionnaire'

type QuestionnaireRow = Database['public']['Tables']['questionnaires']['Row']
type QuestionnaireInsert = Database['public']['Tables']['questionnaires']['Insert']
type QuestionnaireUpdate = Database['public']['Tables']['questionnaires']['Update']
type SurveyTokenRow = Database['public']['Tables']['survey_tokens']['Row']
type SurveyTokenInsert = Database['public']['Tables']['survey_tokens']['Insert']
type SurveyResponseRow = Database['public']['Tables']['survey_responses']['Row']
type SurveyResponseInsert = Database['public']['Tables']['survey_responses']['Insert']

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
 * 获取问卷列表（服务端）
 */
export async function getQuestionnaires(
  filters: QuestionnaireFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<Questionnaire>> {
  const supabase = await createSupabaseServerClient()
  const { page = 1, pageSize = 10 } = pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('questionnaires')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new Error(`获取问卷列表失败: ${error.message}`)
  }

  return {
    data: (data || []) as Questionnaire[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * 根据ID获取问卷（服务端）
 */
export async function getQuestionnaireById(id: string): Promise<Questionnaire | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`获取问卷信息失败: ${error.message}`)
  }

  return data as Questionnaire
}

/**
 * 创建问卷（服务端）
 */
export async function createQuestionnaire(
  questionnaireData: {
    title: string
    description?: string
    questions: Question[]
    status?: 'draft' | 'active' | 'archived'
  }
): Promise<Questionnaire> {
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('questionnaires')
    .insert({
      title: questionnaireData.title,
      description: questionnaireData.description || null,
      questions: questionnaireData.questions,
      status: questionnaireData.status || 'draft',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`创建问卷失败: ${error.message}`)
  }

  return data as Questionnaire
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
  }>
): Promise<Questionnaire> {
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('questionnaires')
    .update(questionnaireData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`更新问卷失败: ${error.message}`)
  }

  return data as Questionnaire
}

/**
 * 生成问卷令牌（服务端）
 */
export async function generateSurveyToken(
  employeeId: string,
  questionnaireId: string,
  expiresInDays: number = 30
): Promise<string> {
  const supabase = await createSupabaseServerClient()

  // 生成随机令牌
  const token = crypto.randomUUID().replace(/-/g, '').toUpperCase()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('survey_tokens').insert({
    token,
    employee_id: employeeId,
    questionnaire_id: questionnaireId,
    used: false,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    throw new Error(`生成问卷令牌失败: ${error.message}`)
  }

  return token
}

/**
 * 验证问卷令牌（服务端）
 */
export async function validateSurveyToken(
  token: string
): Promise<{ valid: boolean; employeeId?: string; questionnaireId?: string; error?: string }> {
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('survey_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !data) {
    return { valid: false, error: '无效的问卷链接' }
  }

  if (data.used) {
    return { valid: false, error: '该问卷链接已使用' }
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, error: '该问卷链接已过期' }
  }

  return {
    valid: true,
    employeeId: data.employee_id || undefined,
    questionnaireId: data.questionnaire_id || undefined,
  }
}

/**
 * 提交问卷回答（服务端）
 */
export async function submitSurveyResponse(
  token: string,
  answers: Record<string, string | string[]>
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any

  // 验证令牌
  const validation = await validateSurveyToken(token)
  if (!validation.valid) {
    throw new Error(validation.error || '无效的问卷链接')
  }

  // 获取令牌信息
  const { data: tokenData, error: tokenError } = await supabaseAny
    .from('survey_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (tokenError || !tokenData) {
    throw new Error('获取令牌信息失败')
  }

  // 插入回答
  const { error: insertError } = await supabaseAny.from('survey_responses').insert({
    employee_id: tokenData.employee_id,
    questionnaire_id: tokenData.questionnaire_id,
    answers: answers,
    submit_channel: 'survey',
  })

  if (insertError) {
    throw new Error(`提交问卷回答失败: ${insertError.message}`)
  }

  // 标记令牌已使用
  const { error: updateError } = await supabaseAny
    .from('survey_tokens')
    .update({ used: true })
    .eq('token', token)

  if (updateError) {
    throw new Error(`更新令牌状态失败: ${updateError.message}`)
  }
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
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any

  let tokensQuery = supabaseAny.from('survey_tokens').select('*')
  if (questionnaireId) {
    tokensQuery = tokensQuery.eq('questionnaire_id', questionnaireId)
  }

  const { data: tokens, error: tokensError } = await tokensQuery

  if (tokensError) {
    throw new Error(`获取问卷令牌失败: ${tokensError.message}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalSent = (tokens as any[])?.length || 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalResponded = (tokens as any[])?.filter((t: any) => t.used).length || 0
  const responseRate = totalSent > 0 ? (totalResponded / totalSent) * 100 : 0

  return {
    totalSent,
    totalResponded,
    responseRate,
  }
}

/**
 * 获取活跃问卷（客户端）
 */
export async function getActiveQuestionnairesClient(): Promise<Questionnaire[]> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`获取活跃问卷失败: ${error.message}`)
  }

  return (data || []) as Questionnaire[]
}
