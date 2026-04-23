'use client'

import { useRouter } from 'next/navigation'
import { useState, use, useEffect } from 'react'
import { getFollowUpPlanById, createFollowUpRecord } from '@/lib/db/follow-ups'
import { getEmployeeById } from '@/lib/db/employees'
import { FollowUpForm } from '@/components/follow-ups/follow-up-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { FollowUpPlan } from '@/types/follow-up'
import {
  CONTACT_METHODS,
  CONTACT_RESULTS,
  SALARY_CHANGES,
} from '@/types/follow-up'

const getLabel = (items: readonly { value: string; label: string }[], value: string): string => {
  const found = items.find(item => item.value === value)
  return found ? found.label : value
}

interface FollowUpRecord {
  id: string
  contact_method: string
  contact_result: string
  new_company: string | null
  new_position: string | null
  salary_change: string | null
  personal_feeling: string | null
  suggestions: string | null
  created_at: string
}

export const dynamic = 'force-dynamic'

export default function FollowUpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const [isLoading, setIsLoading] = useState(false)
  const [plan, setPlan] = useState<FollowUpPlan | null>(null)
  const [record, setRecord] = useState<FollowUpRecord | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 通过 API 获取回访计划
        const response = await fetch(`/api/follow-ups/${id}`)
        if (!response.ok) {
          toast.error('获取回访计划失败')
          return
        }

        const data = await response.json()
        setPlan(data.plan)
        setRecord(data.record)
      } catch (error) {
        toast.error('获取回访计划失败')
      }
    }
    fetchData()
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
      // 通过 API 创建回访记录
      const response = await fetch(`/api/follow-ups/${id}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: plan.employee_id,
          contact_method: data.contact_method,
          contact_result: data.contact_result,
          new_company: data.new_company || null,
          new_position: data.new_position || null,
          salary_change: data.salary_change || null,
          personal_feeling: data.personal_feeling || null,
          suggestions: data.suggestions || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '提交失败')
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

  // 显示已登记的回访记录
  if (plan && record) {
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
              回访记录详情
              <Badge variant="default">已完成</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">员工姓名</p>
                <p className="font-medium">{plan.employee?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">部门</p>
                <p className="font-medium">{plan.employee?.department}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">班组</p>
                <p className="font-medium">{plan.employee?.team || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">联系方式</p>
                <p className="font-medium">{getLabel(CONTACT_METHODS, record.contact_method)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">联系结果</p>
                <p className="font-medium">{getLabel(CONTACT_RESULTS, record.contact_result)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">薪资变化</p>
                <p className="font-medium">{record.salary_change ? getLabel(SALARY_CHANGES, record.salary_change) : '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">新公司</p>
                <p className="font-medium">{record.new_company || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">新职位</p>
                <p className="font-medium">{record.new_position || '-'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">个人感受</p>
              <p className="whitespace-pre-wrap">{record.personal_feeling || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">对公司建议</p>
              <p className="whitespace-pre-wrap">{record.suggestions || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">登记时间</p>
              <p>{new Date(record.created_at).toLocaleString('zh-CN')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 显示录入表单
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
            登记回访记录
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