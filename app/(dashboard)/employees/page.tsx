import { getEmployees } from '@/lib/db/employees'
import { EmployeeList } from '@/components/employees/employee-list'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const { data: employees } = await getEmployees()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">离职员工管理</h2>
        <div className="flex gap-2">
          <Link href="/employees/import">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              批量导入
            </Button>
          </Link>
          <Link href="/employees/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增员工
            </Button>
          </Link>
        </div>
      </div>

      <EmployeeList employees={employees} />
    </div>
  )
}
