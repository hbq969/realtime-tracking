'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createEmployeeAction, createDefaultFollowUpPlansAction } from '@/lib/actions/employees'
import { EmployeeForm } from '@/components/employees/employee-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AddEmployeePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: any) => {
    setLoading(true)
    try {
      const result = await createEmployeeAction(data)
      if (!result.success) {
        toast.error('添加失败: ' + result.error)
        return
      }

      await createDefaultFollowUpPlansAction(result.data!.id, data.leave_date)
      toast.success('员工添加成功')
      router.push('/employees')
    } catch (error) {
      console.error(error)
      toast.error('添加失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/employees">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回员工列表
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>新增离职员工</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  )
}
