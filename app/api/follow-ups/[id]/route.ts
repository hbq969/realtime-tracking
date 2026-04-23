import { NextRequest, NextResponse } from 'next/server'
import { getFollowUpPlanById } from '@/lib/db/follow-ups'
import { getDb } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const plan = await getFollowUpPlanById(id)

    if (!plan) {
      return NextResponse.json({ error: '回访计划不存在' }, { status: 404 })
    }

    // 如果已完成，获取回访记录
    let record = null
    if (plan.status === 'completed') {
      const db = await getDb()
      const results = db.exec(
        `SELECT id, contact_method, contact_result, new_company, new_position,
                salary_change, personal_feeling, suggestions, created_at
         FROM follow_up_records
         WHERE plan_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [id]
      )
      const rows = results[0]?.values || []
      if (rows.length > 0) {
        const row = rows[0]
        record = {
          id: row[0],
          contact_method: row[1],
          contact_result: row[2],
          new_company: row[3],
          new_position: row[4],
          salary_change: row[5],
          personal_feeling: row[6],
          suggestions: row[7],
          created_at: row[8],
        }
      }
    }

    return NextResponse.json({ plan, record })
  } catch (error) {
    console.error('获取回访计划失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    )
  }
}