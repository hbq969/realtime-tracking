import { notFound, redirect } from 'next/navigation'
import { getEmployeeById } from '@/lib/db/employees'
import { EditEmployeeForm } from './edit-form'

export const dynamic = 'force-dynamic'

export default async function EditEmployeePage({
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
      <h2 className="text-2xl font-semibold">编辑员工</h2>
      <EditEmployeeForm employee={employee} />
    </div>
  )
}
