import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDatabase, generateId } from '@/lib/db'
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

    const db = await getDb()
    let imported = 0

    // 插入数据
    for (const row of data) {
      const responseId = generateId()
      const answersJson = JSON.stringify(row.answers)

      db.run(
        `INSERT INTO survey_responses (id, employee_id, questionnaire_id, answers, submit_channel, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [responseId, row.employeeId, id, answersJson, 'manual', row.submittedAt]
      )
      imported++
    }

    saveDatabase()

    return NextResponse.json({
      success: true,
      imported,
    })
  } catch (error) {
    console.error('导入问卷数据失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导入失败' },
      { status: 500 }
    )
  }
}