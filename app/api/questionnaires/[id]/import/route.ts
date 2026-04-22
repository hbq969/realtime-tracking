import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getQuestionnaireById } from '@/lib/db/questionnaires'

interface ImportData {
  employeeId: string
  submittedAt: string
  answers: Record<string, string>
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data } = await request.json() as { data: ImportData[] }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: '无效的导入数据' }, { status: 400 })
    }

    // 验证问卷存在
    const questionnaire = await getQuestionnaireById(id)
    if (!questionnaire) {
      return NextResponse.json({ error: '问卷不存在' }, { status: 404 })
    }

    const supabase = await createSupabaseServerClient()

    // 插入数据
    const insertData = data.map(row => ({
      employee_id: row.employeeId,
      questionnaire_id: id,
      answers: row.answers,
      submit_channel: 'manual',
      submitted_at: row.submittedAt,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('survey_responses')
      .insert(insertData)

    if (error) {
      throw new Error(`导入失败: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      imported: data.length,
    })
  } catch (error) {
    console.error('导入问卷数据失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导入失败' },
      { status: 500 }
    )
  }
}