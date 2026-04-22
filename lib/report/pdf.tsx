/**
 * PDF报告生成
 * 使用 @react-pdf/renderer 生成报告
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { ReportContent } from '@/types/report'

// 样式定义 - 使用默认字体避免字体加载问题
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 40,
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: 'bold',
    borderBottom: '1px solid #333',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '40%',
    fontSize: 12,
  },
  value: {
    width: '60%',
    fontSize: 12,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #ddd',
    padding: 5,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
  },
  tableCell: {
    width: '50%',
    fontSize: 10,
  },
  suggestion: {
    fontSize: 10,
    marginBottom: 5,
    padding: 5,
    backgroundColor: '#f9f9f9',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
})

interface ReportPDFProps {
  title: string
  type: string
  content: ReportContent
  generatedAt: string
}

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

/**
 * 生成PDF文档组件
 */
export function ReportPDF({ title, type, content, generatedAt }: ReportPDFProps) {
  const leaveReasonData = Object.entries(content.leave_reasons)
    .map(([reason, count]) => ({
      reason: leaveReasonNames[reason] || reason,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  const salaryChangeData = Object.entries(content.salary_changes)
    .map(([change, count]) => ({
      change: salaryChangeNames[change] || change,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 标题 */}
        <Text style={styles.title}>{title}</Text>

        {/* 报告信息 */}
        <View style={styles.row}>
          <Text style={styles.label}>报告类型:</Text>
          <Text style={styles.value}>{reportTypeNames[type] || type}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>生成时间:</Text>
          <Text style={styles.value}>{generatedAt}</Text>
        </View>

        {/* 概览统计 */}
        <Text style={styles.sectionTitle}>概览统计</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>指标</Text>
            <Text style={styles.tableCell}>数值</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>总离职人数</Text>
            <Text style={styles.tableCell}>{content.summary.total_employees} 人</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>回访率</Text>
            <Text style={styles.tableCell}>{content.summary.follow_up_rate}%</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>问卷回答率</Text>
            <Text style={styles.tableCell}>{content.summary.survey_response_rate}%</Text>
          </View>
        </View>

        {/* 离职原因分析 */}
        {leaveReasonData.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>离职原因分析</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>离职原因</Text>
                <Text style={styles.tableCell}>人数</Text>
              </View>
              {leaveReasonData.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{item.reason}</Text>
                  <Text style={styles.tableCell}>{item.count}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 薪资变化统计 */}
        {salaryChangeData.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>薪资变化统计</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>薪资变化</Text>
                <Text style={styles.tableCell}>人数</Text>
              </View>
              {salaryChangeData.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{item.change}</Text>
                  <Text style={styles.tableCell}>{item.count}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 新公司统计 */}
        {content.new_companies.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>新公司统计 (前10)</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>公司名称</Text>
                <Text style={styles.tableCell}>人数</Text>
              </View>
              {content.new_companies.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{item.name}</Text>
                  <Text style={styles.tableCell}>{item.count}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 员工建议 */}
        {content.suggestions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>员工建议 (节选)</Text>
            {content.suggestions.slice(0, 10).map((suggestion, index) => (
              <Text key={index} style={styles.suggestion}>
                {index + 1}. {suggestion}
              </Text>
            ))}
          </>
        )}

        {/* 页脚 */}
        <Text style={styles.footer}>
          离职人员动态跟踪系统 - 生成于 {generatedAt}
        </Text>
      </Page>
    </Document>
  )
}

/**
 * 生成PDF并返回Blob URL（服务端渲染）
 */
export async function generatePDFBlob(
  title: string,
  type: string,
  content: ReportContent
): Promise<Blob> {
  const { pdf } = await import('@react-pdf/renderer')
  const generatedAt = new Date().toLocaleString('zh-CN')

  const doc = <ReportPDF title={title} type={type} content={content} generatedAt={generatedAt} />
  const blob = await pdf(doc).toBlob()

  return blob
}

/**
 * 生成PDF并返回ArrayBuffer（用于下载）
 */
export async function generatePDFBuffer(
  title: string,
  type: string,
  content: ReportContent
): Promise<Uint8Array> {
  const { pdf } = await import('@react-pdf/renderer')
  const generatedAt = new Date().toLocaleString('zh-CN')

  const doc = <ReportPDF title={title} type={type} content={content} generatedAt={generatedAt} />
  const blob = await pdf(doc).toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}
