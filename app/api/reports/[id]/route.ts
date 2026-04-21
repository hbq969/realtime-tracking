import { NextRequest, NextResponse } from 'next/server'
import { deleteReport, getReportById } from '@/lib/db/reports'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = await getReportById(id)

    if (!report) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('获取报告失败:', error)
    return NextResponse.json({ error: '获取报告失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteReport(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除报告失败:', error)
    return NextResponse.json({ error: '删除报告失败' }, { status: 500 })
  }
}
