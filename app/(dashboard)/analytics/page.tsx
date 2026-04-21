import { getEmployeeStats } from '@/lib/db/employees'
import { getFollowUpStats } from '@/lib/db/follow-ups'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart } from '@/components/analytics/pie-chart'
import { BarChart } from '@/components/analytics/bar-chart'

export default async function AnalyticsPage() {
  const employeeStats = await getEmployeeStats()
  const followUpStats = await getFollowUpStats()

  // 离职原因分布数据
  const leaveReasonData = Object.entries(employeeStats.byLeaveReason).map(
    ([name, value]) => ({ name, value })
  )

  // 部门分布数据
  const departmentData = Object.entries(employeeStats.byDepartment).map(
    ([name, value]) => ({ name, value })
  )

  // 回访类型分布
  const followUpTypeData = Object.entries(followUpStats.byType).map(
    ([name, value]) => {
      const typeNames: Record<string, string> = {
        '1m': '1个月',
        '3m': '3个月',
        '6m': '6个月',
        custom: '自定义',
      }
      return { name: typeNames[name] || name, value }
    }
  )

  // 联系方式分布
  const contactMethodData = Object.entries(followUpStats.byContactMethod).map(
    ([name, value]) => {
      const methodNames: Record<string, string> = {
        phone: '电话',
        wechat: '微信',
        email: '邮件',
        meeting: '面谈',
      }
      return { name: methodNames[name] || name, value }
    }
  )

  // 计算完成率
  const completionRate = followUpStats.total > 0
    ? (followUpStats.completed / followUpStats.total)
    : 0

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">数据分析</h2>

      {/* 概览统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总离职人数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              待跟进
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {employeeStats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已跟进
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {employeeStats.followed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              回访完成率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(completionRate * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 离职原因分布 */}
        {leaveReasonData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>离职原因分布</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart data={leaveReasonData} />
            </CardContent>
          </Card>
        )}

        {/* 部门分布 */}
        {departmentData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>部门分布</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={departmentData}
                bars={[{ key: 'value', color: '#3b82f6', name: '人数' }]}
              />
            </CardContent>
          </Card>
        )}

        {/* 回访统计详情 */}
        <Card>
          <CardHeader>
            <CardTitle>回访统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">总计划数</span>
                <span className="font-bold text-lg">{followUpStats.total}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-700">已完成</span>
                <span className="font-bold text-green-600">
                  {followUpStats.completed}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-orange-700">待回访</span>
                <span className="font-bold text-orange-600">
                  {followUpStats.pending}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-700">已逾期</span>
                <span className="font-bold text-red-600">
                  {followUpStats.overdue}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 回访类型分布 */}
        {followUpTypeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>回访类型分布</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart data={followUpTypeData} />
            </CardContent>
          </Card>
        )}

        {/* 联系方式分布 */}
        {contactMethodData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>联系方式分布</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={contactMethodData}
                bars={[{ key: 'value', color: '#10b981', name: '次数' }]}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
