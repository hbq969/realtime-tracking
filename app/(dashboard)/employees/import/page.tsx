'use client'

import { useRouter } from 'next/navigation'
import { EmployeeImport } from '@/components/employees/employee-import'
import { importEmployeesAction, createDefaultFollowUpPlansAction } from '@/lib/actions/employees'
import { toast } from 'sonner'

export default function ImportEmployeesPage() {
  const router = useRouter()

  const handleImport = async (data: Record<string, string>[]) => {
    const employees = data.map(row => ({
      name: row['姓名'] || row['name'],
      phone: row['手机号'] || row['phone'],
      email: row['邮箱'] || row['email'],
      department: row['部门'] || row['department'],
      position: row['职位'] || row['position'],
      leave_date: row['离职日期'] || row['leave_date'],
      leave_reason: row['离职原因'] || row['leave_reason'],
      employment_duration: Number(row['在职时长'] || row['employment_duration'] || 0),
    })).filter(e => e.name && e.phone && e.email)

    if (employees.length === 0) {
      toast.error('没有有效的员工数据')
      return
    }

    try {
      const result = await importEmployeesAction(employees)

      if (result.success > 0) {
        toast.success(`成功导入 ${result.success} 条记录`)
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} 条记录导入失败`)
      }

      router.push('/employees')
    } catch (error) {
      toast.error('导入失败: ' + (error as Error).message)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <EmployeeImport onImport={handleImport} />
    </div>
  )
}
