import Link from 'next/link'
import { getReports } from '@/lib/db/reports'
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
import { FileBarChart, Plus, Eye, Trash2 } from 'lucide-react'
import { ReportDeleteButton } from '@/components/reports/report-delete-button'

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

export default async function ReportsPage() {
  const { data: reports } = await getReports({ pageSize: 50 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">报告中心</h2>
        <Link href="/reports/generate">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            创建报告
          </Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总报告数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              综合报告
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {reports.filter((r) => r.type === 'summary').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              离职分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reports.filter((r) => r.type === 'leave_analysis').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              回访报告
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {reports.filter((r) => r.type === 'follow_up').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 报告列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            报告列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无报告，点击右上角"创建报告"按钮创建新报告
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">报告名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>生成时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.title}</TableCell>
                    <TableCell>
                      <Badge variant={reportTypeColors[report.type] || 'default'}>
                        {reportTypeNames[report.type] || report.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(report.created_at).toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/reports/${report.id}`}>
                          <Button variant="outline" size="icon-xs">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <ReportDeleteButton reportId={report.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
