import { NextRequest, NextResponse } from 'next/server'
import { createReport } from '@/lib/db/reports'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, type, filters } = body

    if (!title || !type) {
      return NextResponse.json(
        { error: '报告名称和类型不能为空' },
        { status: 400 }
      )
    }

    const report = await createReport(title, type, filters || {})

    return NextResponse.json(report)
  } catch (error) {
    console.error('创建报告失败:', error)
    return NextResponse.json(
      { error: '创建报告失败' },
      { status: 500 }
    )
  }
}
