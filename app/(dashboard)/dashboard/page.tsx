import { getEmployeeStats } from '@/lib/db/employees'
import { getFollowUpStats, getUpcomingFollowUps } from '@/lib/db/follow-ups'
import { getSurveyResponseRate } from '@/lib/db/questionnaires'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, FileText, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const employeeStats = await getEmployeeStats()
  const followUpStats = await getFollowUpStats()
  const surveyStats = await getSurveyResponseRate()
  const upcomingFollowUps = await getUpcomingFollowUps(7)

  const stats = [
    {
      title: '离职员工总数',
      value: employeeStats.total,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: '回访完成率',
      value: `${(followUpStats.completed / (followUpStats.total || 1) * 100).toFixed(1)}%`,
      icon: UserCheck,
      color: 'text-green-600',
    },
    {
      title: '问卷回收率',
      value: `${surveyStats.responseRate.toFixed(1)}%`,
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      title: '待回访',
      value: followUpStats.pending,
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">仪表盘</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>近7天待回访</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingFollowUps.length === 0 ? (
              <p className="text-slate-500 text-sm">暂无待回访计划</p>
            ) : (
              <div className="space-y-3">
                {upcomingFollowUps.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{plan.employee?.name}</p>
                      <p className="text-sm text-slate-500">
                        {plan.employee?.department} - {plan.plan_date}
                      </p>
                    </div>
                    <Badge variant="outline">{plan.follow_up_type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>离职原因分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(employeeStats.byLeaveReason).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between">
                  <span className="text-sm">{reason}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${(count / employeeStats.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-slate-500 w-8">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(employeeStats.byLeaveReason).length === 0 && (
                <p className="text-slate-500 text-sm">暂无数据</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
