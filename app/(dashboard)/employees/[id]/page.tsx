import { notFound } from 'next/navigation'
import { getEmployeeById } from '@/lib/db/employees'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let employee
  try {
    employee = await getEmployeeById(id)
    if (!employee) {
      notFound()
    }
  } catch {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-semibold">员工详情</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{employee.name}</CardTitle>
            <Badge variant={employee.status === 'followed' ? 'default' : 'secondary'}>
              {employee.status === 'followed' ? '已回访' : '待回访'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-slate-500">姓名</dt>
              <dd className="font-medium">{employee.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">手机号</dt>
              <dd>{employee.phone}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">邮箱</dt>
              <dd>{employee.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">部门</dt>
              <dd>{employee.department}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">职位</dt>
              <dd>{employee.position}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">离职日期</dt>
              <dd>{employee.leave_date}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">离职原因</dt>
              <dd>{employee.leave_reason}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">在职时长</dt>
              <dd>{employee.employment_duration} 个月</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
