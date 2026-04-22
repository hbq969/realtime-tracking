'use client'

import { useRouter } from 'next/navigation'
import { useState, use, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { FollowUpForm } from '@/components/follow-ups/follow-up-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { FollowUpPlan } from '@/types/follow-up'

export default function FollowUpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const [isLoading, setIsLoading] = useState(false)
  const [plan, setPlan] = useState<FollowUpPlan | null>(null)

  useEffect(() => {
    const fetchPlan = async () => {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('follow_up_plans')
        .select(
          `
          *,
          employees (
            name,
            phone,
            department
          )
        `
        )
        .eq('id', id)
        .single()

      if (error) {
        toast.error('获取回访计划失败')
        return
      }

      setPlan({
        ...(data as any),
        employee: (data as any).employees
          ? {
              name: (data as any).employees.name,
              phone: (data as any).employees.phone,
              department: (data as any).employees.department,
            }
          : undefined,
      } as FollowUpPlan)
    }
    fetchPlan()
  }, [id])

  const handleSubmit = async (data: {
    contact_method: string
    contact_result: string
    new_company: string
    new_position: string
    salary_change: string
    personal_feeling: string
    suggestions: string
  }) => {
    if (!plan) {
      toast.error('回访计划不存在')
      return
    }
    setIsLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()

      // 创建回访记录
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: recordError } = await (supabase as any).from('follow_up_records').insert({
        plan_id: id,
        employee_id: plan.employee_id,
        contact_method: data.contact_method,
        contact_result: data.contact_result,
        new_company: data.new_company || null,
        new_position: data.new_position || null,
        salary_change: data.salary_change || null,
        personal_feeling: data.personal_feeling || null,
        suggestions: data.suggestions || null,
      })

      if (recordError) {
        throw new Error(recordError.message)
      }

      // 更新回访计划状态
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('follow_up_plans')
        .update({ status: 'completed' })
        .eq('id', id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // 更新员工状态
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: employeeUpdateError } = await (supabase as any)
        .from('employees')
        .update({ status: 'followed', updated_at: new Date().toISOString() })
        .eq('id', plan.employee_id)

      if (employeeUpdateError) {
        throw new Error(employeeUpdateError.message)
      }

      toast.success('回访记录已提交')
      router.push('/follow-ups')
    } catch (error) {
      console.error('提交回访记录失败:', error)
      toast.error('提交失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/follow-ups">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回回访列表
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            录入回访记录
            <Badge variant="secondary">回访管理</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FollowUpForm onSubmit={handleSubmit} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
