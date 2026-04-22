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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, Send, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEmployeeAction, batchDeleteEmployeesAction } from '@/lib/actions/employees'

interface EmployeeListProps {
  employees: Employee[]
  onSendSurvey?: (employeeId: string) => void
}

export function EmployeeList({ employees, onSendSurvey }: EmployeeListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelectAll = () => {
    if (selectedIds.size === employees.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(employees.map((e) => e.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteEmployeeAction(id)
    })
  }

  const handleBatchDelete = () => {
    startTransition(async () => {
      await batchDeleteEmployeesAction(Array.from(selectedIds))
      setSelectedIds(new Set())
    })
  }

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isPending}>
                <Trash2 className="h-4 w-4 mr-2" />
                删除选中 ({selectedIds.size})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除选中的 {selectedIds.size} 名员工吗？此操作不可撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleBatchDelete}>确认删除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={employees.length > 0 && selectedIds.size === employees.length}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>姓名</TableHead>
            <TableHead>部门</TableHead>
            <TableHead>班组</TableHead>
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
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(employee.id)}
                  onCheckedChange={() => toggleSelect(employee.id)}
                />
              </TableCell>
              <TableCell className="font-medium">{employee.name}</TableCell>
              <TableCell>{employee.department || '-'}</TableCell>
              <TableCell>{employee.team || '-'}</TableCell>
              <TableCell>{employee.position || '-'}</TableCell>
              <TableCell>{employee.leave_date || '-'}</TableCell>
              <TableCell>{employee.leave_reason || '-'}</TableCell>
              <TableCell>
                <Badge variant={employee.status === 'followed' ? 'default' : 'secondary'}>
                  {employee.status === 'followed' ? '已回访' : '待回访'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Link href={`/employees/${employee.id}`}>
                    <Button variant="ghost" size="icon" title="查看">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/employees/${employee.id}/edit`}>
                    <Button variant="ghost" size="icon" title="编辑">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="删除">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除员工 "{employee.name}" 吗？此操作不可撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(employee.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          确认删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {onSendSurvey && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSendSurvey(employee.id)}
                      title="发送问卷"
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
    </div>
  )
}
