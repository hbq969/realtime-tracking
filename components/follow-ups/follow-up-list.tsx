'use client'

import { FollowUpPlan } from '@/types/follow-up'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'

interface FollowUpListProps {
  plans: FollowUpPlan[]
}

export function FollowUpList({ plans }: FollowUpListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>员工姓名</TableHead>
          <TableHead>部门</TableHead>
          <TableHead>计划日期</TableHead>
          <TableHead>回访类型</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell className="font-medium">
              {plan.employee?.name}
            </TableCell>
            <TableCell>{plan.employee?.department}</TableCell>
            <TableCell>{plan.plan_date}</TableCell>
            <TableCell>
              {plan.follow_up_type === '1m' && '1个月'}
              {plan.follow_up_type === '3m' && '3个月'}
              {plan.follow_up_type === '6m' && '6个月'}
              {plan.follow_up_type === 'custom' && '自定义'}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  plan.status === 'completed'
                    ? 'default'
                    : plan.status === 'overdue'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {plan.status === 'completed'
                  ? '已完成'
                  : plan.status === 'overdue'
                  ? '已逾期'
                  : '待回访'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/follow-ups/${plan.id}`}
                className="text-primary hover:underline text-sm"
              >
                查看详情
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
