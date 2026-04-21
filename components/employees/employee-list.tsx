'use client'

import type { Employee } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, Send } from 'lucide-react'
import Link from 'next/link'

interface EmployeeListProps {
  employees: Employee[]
  onSendSurvey?: (employeeId: string) => void
}

export function EmployeeList({ employees, onSendSurvey }: EmployeeListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>姓名</TableHead>
          <TableHead>部门</TableHead>
          <TableHead>职位</TableHead>
          <TableHead>离职日期</TableHead>
          <TableHead>离职原因</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell className="font-medium">{employee.name}</TableCell>
            <TableCell>{employee.department || '-'}</TableCell>
            <TableCell>{employee.position || '-'}</TableCell>
            <TableCell>{employee.leave_date || '-'}</TableCell>
            <TableCell>{employee.leave_reason || '-'}</TableCell>
            <TableCell>
              <Badge variant={employee.status === 'followed' ? 'default' : 'secondary'}>
                {employee.status === 'followed' ? '已回访' : '待回访'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Link href={`/employees/${employee.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                {onSendSurvey && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSendSurvey(employee.id)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
