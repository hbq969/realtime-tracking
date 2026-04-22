import { NextRequest, NextResponse } from 'next/server'
import { parseImportData, type ImportRow } from '@/lib/import/survey-data'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { rows } = await request.json() as { rows: ImportRow[] }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '无效的数据' }, { status: 400 })
    }

    // 解析并匹配员工
    const data = await parseImportData(rows)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('解析数据失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '解析失败' },
      { status: 500 }
    )
  }
}