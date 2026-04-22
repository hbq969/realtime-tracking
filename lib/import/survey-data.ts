/**
 * 问卷数据导入解析工具
 */
import { createSupabaseServerClient } from '@/lib/supabase/server'

// 导入行数据类型
export interface ImportRow {
  [key: string]: string
}

// 解析结果
export interface ParsedRow {
  employeeId: string | null
  employeeName: string
  employeePhone: string
  submittedAt: string
  answers: Record<string, string>
  matchStatus: 'matched' | 'not_found' | 'multiple_match'
  matchError?: string
}

// 跳过的系统列
const SKIP_COLUMNS = [
  '编号',
  '开始答题时间',
  '结束答题时间',
  '答题时长',
  '语言',
  '清洗数据',
  '地理位置',
  'IP',
  'UA',
  'Referrer',
  '自定义字段',
]

/**
 * 解析腾讯问卷导出的 CSV 行数据
 */
export function parseTencentSurveyRow(row: ImportRow): {
  name: string | null
  phone: string | null
  submittedAt: string
  answers: Record<string, string>
} {
  // 获取姓名
  const nameColumn = Object.keys(row).find(key => key.includes('您的姓名'))
  const name = nameColumn ? row[nameColumn]?.trim() : null

  // 获取手机号（清洗制表符）
  const phoneColumn = Object.keys(row).find(key => key.includes('您的手机号码'))
  const phone = phoneColumn ? row[phoneColumn]?.trim().replace(/\t/g, '') : null

  // 获取提交时间
  const submittedAt = row['开始答题时间'] || new Date().toISOString()

  // 解析答案
  const answers: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    // 跳过系统列和身份识别列
    if (SKIP_COLUMNS.some(skip => key.includes(skip))) continue
    if (key.includes('您的姓名') || key.includes('您的手机号码')) continue

    // 提取题目标题（去掉编号前缀）
    const questionTitle = key.replace(/^\d+\./, '').trim()

    // 提取答案内容（去掉选项字母前缀）
    const answerValue = value?.replace(/^[A-Z]\./, '').trim() || ''

    answers[questionTitle] = answerValue
  }

  return { name, phone, submittedAt, answers }
}

/**
 * 匹配员工
 */
export async function matchEmployee(
  name: string | null,
  phone: string | null
): Promise<{ id: string; status: 'matched' | 'not_found' | 'multiple_match'; error?: string }> {
  const supabase = await createSupabaseServerClient()

  // 优先通过姓名匹配
  if (name) {
    const { data: byName, error } = await supabase
      .from('employees')
      .select('id')
      .eq('name', name)
      .limit(2)

    if (!error && byName && byName.length === 1) {
      return { id: byName[0].id, status: 'matched' }
    }
    if (byName && byName.length > 1) {
      return { id: '', status: 'multiple_match', error: '存在多个同名员工' }
    }
  }

  // 通过手机号匹配
  if (phone) {
    const { data: byPhone, error } = await supabase
      .from('employees')
      .select('id')
      .eq('phone', phone)
      .limit(1)

    if (!error && byPhone && byPhone.length === 1) {
      return { id: byPhone[0].id, status: 'matched' }
    }
  }

  return { id: '', status: 'not_found', error: '未找到匹配员工' }
}

/**
 * 批量解析导入数据
 */
export async function parseImportData(rows: ImportRow[]): Promise<ParsedRow[]> {
  const results: ParsedRow[] = []

  for (const row of rows) {
    const { name, phone, submittedAt, answers } = parseTencentSurveyRow(row)

    const matchResult = await matchEmployee(name, phone)

    results.push({
      employeeId: matchResult.status === 'matched' ? matchResult.id : null,
      employeeName: name || '',
      employeePhone: phone || '',
      submittedAt,
      answers,
      matchStatus: matchResult.status,
      matchError: matchResult.error,
    })
  }

  return results
}

/**
 * 解析 CSV 文本为行数据
 */
export function parseCSVText(text: string): ImportRow[] {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const rows: ImportRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: ImportRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return rows
}

/**
 * 解析 CSV 行
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())

  return result
}
