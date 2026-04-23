import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getReportById } from '@/lib/db/reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  FileDown,
  FileText,
  BarChart3,
  Building2,
  MessageSquare,
} from 'lucide-react'
import type { ReportContent } from '@/types/report'
import { ReportExportButton } from '@/components/reports/report-export-button'

// 报告类型名称映射
const reportTypeNames: Record<string, string> = {
  summary: '综合报告',
  leave_analysis: '离职原因分析',
  follow_up: '回访情况报告',
  retention: '员工保有建议',
}

// 报告类型颜色映射
const reportTypeColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  summary: 'default',
  leave_analysis: 'secondary',
  follow_up: 'outline',
  retention: 'default',
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

interface ReportDetailPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params
  const report = await getReportById(id)

  if (!report) {
    notFound()
  }

  const content = report.content as unknown as ReportContent

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

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="outline" size="icon-xs">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold">{report.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={reportTypeColors[report.type] || 'default'}>
                {reportTypeNames[report.type] || report.type}
              </Badge>
              <span className="text-sm text-muted-foreground">
                生成于 {new Date(report.created_at).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReportExportButton reportId={report.id} type="pdf" />
          <ReportExportButton reportId={report.id} type="word" />
        </div>
      </div>

      {/* 概览统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            概览统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">总离职人数</div>
              <div className="text-3xl font-bold text-blue-700 mt-1">
                {content.summary.total_employees}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">回访率</div>
              <div className="text-3xl font-bold text-green-700 mt-1">
                {content.summary.follow_up_rate}%
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">问卷回答率</div>
              <div className="text-3xl font-bold text-purple-700 mt-1">
                {content.summary.survey_response_rate}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 离职原因分析 */}
      {leaveReasonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              离职原因分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>离职原因</TableHead>
                  <TableHead className="text-right">人数</TableHead>
                  <TableHead className="text-right">占比</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveReasonData.map((item, index) => {
                  const percentage =
                    content.summary.total_employees > 0
                      ? ((item.count / content.summary.total_employees) * 100).toFixed(1)
                      : '0.0'
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.reason}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right">{percentage}%</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 薪资变化统计 */}
      {salaryChangeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>薪资变化统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {salaryChangeData.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-4 ${
                    item.change === '涨薪'
                      ? 'bg-green-50'
                      : item.change === '降薪'
                      ? 'bg-red-50'
                      : 'bg-gray-50'
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${
                      item.change === '涨薪'
                        ? 'text-green-600'
                        : item.change === '降薪'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {item.change}
                  </div>
                  <div
                    className={`text-2xl font-bold mt-1 ${
                      item.change === '涨薪'
                        ? 'text-green-700'
                        : item.change === '降薪'
                        ? 'text-red-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {item.count} 人
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 新公司统计 */}
      {content.new_companies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              新公司统计 (前10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排名</TableHead>
                  <TableHead>公司名称</TableHead>
                  <TableHead className="text-right">人数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.new_companies.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 员工建议 */}
      {content.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              员工建议 (节选前20条)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {content.suggestions.slice(0, 20).map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 bg-muted/50 rounded-lg text-sm"
                >
                  <span className="text-muted-foreground mr-2">
                    {index + 1}.
                  </span>
                  {suggestion}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
