import { NextRequest, NextResponse } from 'next/server'
import { createFollowUpRecord } from '@/lib/db/follow-ups'
import type { FollowUpRecordFormData } from '@/types/follow-up'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const recordData: FollowUpRecordFormData = {
      contact_method: body.contact_method,
      contact_result: body.contact_result,
      new_company: body.new_company,
      new_position: body.new_position,
      salary_change: body.salary_change,
      personal_feeling: body.personal_feeling,
      suggestions: body.suggestions,
    }

    const record = await createFollowUpRecord(id, body.employee_id, recordData)

    return NextResponse.json({ success: true, record })
  } catch (error) {
    console.error('创建回访记录失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    )
  }
}