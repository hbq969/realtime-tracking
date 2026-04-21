/**
 * Word报告生成
 * 使用 docx 库生成可编辑的Word文档
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx'
import type { ReportContent } from '@/types/report'

// 报告类型名称映射
const reportTypeNames: Record<string, string> = {
  summary: '综合报告',
  leave_analysis: '离职原因分析',
  follow_up: '回访情况报告',
  retention: '员工保有建议',
}

// 离职原因名称映射
const leaveReasonNames: Record<string, string> = {
  salary: '薪资待遇',
  development: '发展空间',
  work_environment: '工作环境',
  family: '家庭原因',
  health: '健康原因',
  further_study: '继续深造',
  career_change: '职业转型',
  other: '其他',
}

// 薪资变化名称映射
const salaryChangeNames: Record<string, string> = {
  increase: '涨薪',
  decrease: '降薪',
  same: '持平',
}

interface GenerateWordOptions {
  title: string
  type: string
  content: ReportContent
}

/**
 * 创建表格单元格
 */
function createCell(text: string, isHeader = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: isHeader,
            size: 22,
          }),
        ],
      }),
    ],
    width: {
      size: 50,
      type: WidthType.PERCENTAGE,
    },
  })
}

/**
 * 生成Word文档
 */
export async function generateWordDocument({
  title,
  type,
  content,
}: GenerateWordOptions): Promise<Document> {
  const generatedAt = new Date().toLocaleString('zh-CN')

  // 离职原因数据
  const leaveReasonData = Object.entries(content.leave_reasons)
    .map(([reason, count]) => ({
      reason: leaveReasonNames[reason] || reason,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  // 薪资变化数据
  const salaryChangeData = Object.entries(content.salary_changes)
    .map(([change, count]) => ({
      change: salaryChangeNames[change] || change,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  // 文档内容
  const children: Paragraph[] = []

  // 标题
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  )

  // 报告信息
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '报告类型: ', bold: true }),
        new TextRun(reportTypeNames[type] || type),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '生成时间: ', bold: true }),
        new TextRun(generatedAt),
      ],
      spacing: { after: 300 },
    })
  )

  // 概览统计
  children.push(
    new Paragraph({
      text: '概览统计',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
    })
  )

  // 概览表格
  const summaryTable = new Table({
    rows: [
      new TableRow({
        children: [createCell('指标', true), createCell('数值', true)],
      }),
      new TableRow({
        children: [
          createCell('总离职人数'),
          createCell(`${content.summary.total_employees} 人`),
        ],
      }),
      new TableRow({
        children: [
          createCell('回访率'),
          createCell(`${content.summary.follow_up_rate}%`),
        ],
      }),
      new TableRow({
        children: [
          createCell('问卷回答率'),
          createCell(`${content.summary.survey_response_rate}%`),
        ],
      }),
    ],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  })

  // 离职原因分析
  children.push(
    new Paragraph({
      text: '离职原因分析',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  )

  const leaveReasonTableRows = [
    new TableRow({
      children: [createCell('离职原因', true), createCell('人数', true)],
    }),
    ...leaveReasonData.map(
      (item) =>
        new TableRow({
          children: [createCell(item.reason), createCell(String(item.count))],
        })
    ),
  ]

  const leaveReasonTable = new Table({
    rows: leaveReasonTableRows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  })

  // 薪资变化统计
  children.push(
    new Paragraph({
      text: '薪资变化统计',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  )

  const salaryChangeTableRows = [
    new TableRow({
      children: [createCell('薪资变化', true), createCell('人数', true)],
    }),
    ...salaryChangeData.map(
      (item) =>
        new TableRow({
          children: [createCell(item.change), createCell(String(item.count))],
        })
    ),
  ]

  const salaryChangeTable = new Table({
    rows: salaryChangeTableRows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  })

  // 新公司统计
  children.push(
    new Paragraph({
      text: '新公司统计 (前10)',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  )

  const newCompanyTableRows = [
    new TableRow({
      children: [createCell('公司名称', true), createCell('人数', true)],
    }),
    ...content.new_companies.map(
      (item) =>
        new TableRow({
          children: [createCell(item.name), createCell(String(item.count))],
        })
    ),
  ]

  const newCompanyTable = new Table({
    rows: newCompanyTableRows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  })

  // 员工建议
  children.push(
    new Paragraph({
      text: '员工建议 (节选)',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  )

  const suggestionParagraphs = content.suggestions.slice(0, 10).map(
    (suggestion, index) =>
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${suggestion}`,
            size: 22,
          }),
        ],
        spacing: { after: 100 },
      })
  )

  // 页脚
  children.push(
    new Paragraph({
      text: `离职人员动态跟踪系统 - 生成于 ${generatedAt}`,
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
    })
  )

  // 创建文档
  const doc = new Document({
    sections: [
      {
        children: [
          ...children.slice(0, 5), // 标题和报告信息
          summaryTable,
          ...children.slice(5, 7), // 离职原因标题
          leaveReasonTable,
          ...children.slice(7, 9), // 薪资变化标题
          salaryChangeTable,
          ...children.slice(9, 11), // 新公司标题
          newCompanyTable,
          ...children.slice(11, 13), // 建议标题
          ...suggestionParagraphs,
          ...children.slice(13), // 页脚
        ],
      },
    ],
  })

  return doc
}

/**
 * 生成Word文档并返回Buffer
 */
export async function generateWordBuffer(
  title: string,
  type: string,
  content: ReportContent
): Promise<Uint8Array> {
  const doc = await generateWordDocument({ title, type, content })
  const buffer = await Packer.toBuffer(doc)
  return new Uint8Array(buffer)
}

/**
 * 生成Word文档并返回Blob
 */
export async function generateWordBlob(
  title: string,
  type: string,
  content: ReportContent
): Promise<Blob> {
  const doc = await generateWordDocument({ title, type, content })
  const blob = await Packer.toBlob(doc)
  return blob
}
