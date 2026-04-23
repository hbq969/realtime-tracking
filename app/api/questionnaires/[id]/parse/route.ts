import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDatabase } from '@/lib/db'
import { parseTencentSurveyRow, type ImportRow, type ParsedRow } from '@/lib/import/survey-data'

/**
 * 匹配员工（仅通过姓名匹配）
 */
async function matchEmployee(
  name: string | null
): Promise<{ id: string; status: 'matched' | 'not_found' | 'multiple_match'; error?: string }> {
  const db = await getDb()

  if (!name) {
    return { id: '', status: 'not_found', error: '姓名为空' }
  }

  const results = db.exec(
    'SELECT id FROM employees WHERE name = ? LIMIT 2',
    [name]
  )

  const rows = results[0]?.values || []

  if (rows.length === 1) {
    return { id: rows[0][0] as string, status: 'matched' }
  }

  if (rows.length > 1) {
    return { id: '', status: 'multiple_match', error: '存在多个同名员工' }
  }

  return { id: '', status: 'not_found', error: '未找到匹配员工' }
}

/**
 * 批量解析导入数据
 */
async function parseImportDataWithMatch(rows: ImportRow[]): Promise<ParsedRow[]> {
  const results: ParsedRow[] = []

  for (const row of rows) {
    const { name, submittedAt, answers } = parseTencentSurveyRow(row)

    const matchResult = await matchEmployee(name)

    results.push({
      employeeId: matchResult.status === 'matched' ? matchResult.id : null,
      employeeName: name || '',
      submittedAt,
      answers,
      matchStatus: matchResult.status,
      matchError: matchResult.error,
    })
  }

  return results
}

export async function POST(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const { rows } = await request.json() as { rows: ImportRow[] }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '无效的数据' }, { status: 400 })
    }

    // 解析并匹配员工
    const data = await parseImportDataWithMatch(rows)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('解析数据失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '解析失败' },
      { status: 500 }
    )
  }
}