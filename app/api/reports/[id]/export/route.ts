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

    console.log(`导出报告: id=${id}, type=${type}`)

    const report = await getReportById(id)

    if (!report) {
      console.error(`报告不存在: ${id}`)
      return NextResponse.json({ error: '报告不存在' }, { status: 404 })
    }

    console.log(`报告内容:`, report.content)

    const content = report.content as unknown as ReportContent

    if (type === 'pdf') {
      try {
        const buffer = await generatePDFBuffer(report.title, report.type, content)

        return new NextResponse(Buffer.from(buffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="report-${id}.pdf"`,
          },
        })
      } catch (pdfError) {
        console.error('PDF生成失败:', pdfError)
        return NextResponse.json({ error: `PDF生成失败: ${(pdfError as Error).message}` }, { status: 500 })
      }
    } else if (type === 'word') {
      try {
        const buffer = await generateWordBuffer(report.title, report.type, content)

        return new NextResponse(Buffer.from(buffer), {
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="report-${id}.docx"`,
          },
        })
      } catch (wordError) {
        console.error('Word生成失败:', wordError)
        return NextResponse.json({ error: `Word生成失败: ${(wordError as Error).message}` }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: '不支持的导出类型' }, { status: 400 })
    }
  } catch (error) {
    console.error('导出报告失败:', error)
    return NextResponse.json({ error: `导出报告失败: ${(error as Error).message}` }, { status: 500 })
  }
}
