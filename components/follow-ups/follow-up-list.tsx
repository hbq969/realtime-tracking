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
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

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
          <TableHead>班组</TableHead>
          <TableHead>回访时间</TableHead>
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
            <TableCell>{plan.employee?.team || '-'}</TableCell>
            <TableCell>
              {plan.followUpRecordCreatedAt
                ? new Date(plan.followUpRecordCreatedAt).toLocaleString('zh-CN')
                : '-'}
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
              {plan.status === 'completed' ? (
                <Link href={`/follow-ups/${plan.id}`}>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    查看回访记录
                  </Button>
                </Link>
              ) : (
                <Link href={`/follow-ups/${plan.id}`}>
                  <Button variant="default" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    登记回访记录
                  </Button>
                </Link>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
