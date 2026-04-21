import { NextRequest, NextResponse } from 'next/server'
import { getReportById } from '@/lib/db/reports'
import { generatePDFBuffer } from '@/lib/report/pdf'
import { generateWordBuffer } from '@/lib/report/word'
import type { ReportContent } from '@/types/report'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'pdf'

    const report = await getReportById(id)

    if (!report) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 })
    }

    const content = report.content as unknown as ReportContent

    if (type === 'pdf') {
      const buffer = await generatePDFBuffer(report.title, report.type, content)

      return new NextResponse(Buffer.from(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="report-${id}.pdf"`,
        },
      })
    } else if (type === 'word') {
      const buffer = await generateWordBuffer(report.title, report.type, content)

      return new NextResponse(Buffer.from(buffer), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="report-${id}.docx"`,
        },
      })
    } else {
      return NextResponse.json({ error: '不支持的导出类型' }, { status: 400 })
    }
  } catch (error) {
    console.error('导出报告失败:', error)
    return NextResponse.json({ error: '导出报告失败' }, { status: 500 })
  }
}
