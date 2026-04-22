'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LEAVE_REASONS, DEPARTMENTS, POSITIONS } from '@/types/employee'
import { updateEmployeeAction } from '@/lib/actions/employees'
import type { Employee } from '@/types/database'

const formSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  phone: z.string().min(1, '请输入手机号'),
  email: z.string().email('请输入有效邮箱'),
  department: z.string().min(1, '请选择部门'),
  custom_department: z.string().optional(),
  team: z.string().optional(),
  position: z.string().min(1, '请选择职位'),
  custom_position: z.string().optional(),
  leave_date: z.string().min(1, '请选择离职日期'),
  leave_reason: z.string().min(1, '请选择离职原因'),
  custom_leave_reason: z.string().optional(),
  employment_duration: z.number().min(0, '在职时长不能为负数'),
})

type FormValues = z.infer<typeof formSchema>

interface EditEmployeeFormProps {
  employee: Employee
}

export function EditEmployeeForm({ employee }: EditEmployeeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState(employee.department || '')
  const [selectedPosition, setSelectedPosition] = useState(employee.position || '')
  const [selectedLeaveReason, setSelectedLeaveReason] = useState(employee.leave_reason || '')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: employee.name || '',
      phone: employee.phone || '',
      email: employee.email || '',
      department: employee.department || '',
      team: employee.team || '',
      position: employee.position || '',
      leave_date: employee.leave_date || '',
      leave_reason: employee.leave_reason || '',
      employment_duration: employee.employment_duration || 0,
    },
  })

  const handleFormSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      const submitData = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        department: data.department === '其他' && data.custom_department ? data.custom_department : data.department,
        team: data.team,
        position: data.position === '其他' && data.custom_position ? data.custom_position : data.position,
        leave_date: data.leave_date,
        leave_reason: data.leave_reason === '其他' && data.custom_leave_reason ? data.custom_leave_reason : data.leave_reason,
        employment_duration: data.employment_duration,
      }

      const result = await updateEmployeeAction(employee.id, submitData)
      if (result.success) {
        router.push('/employees')
        router.refresh()
      } else {
        alert(result.error || '更新失败')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">姓名</Label>
          <Input
            id="name"
            placeholder="请输入姓名"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">手机号</Label>
          <Input
            id="phone"
            placeholder="请输入手机号"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          placeholder="请输入邮箱"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">部门</Label>
          <Select
            value={selectedDepartment}
            onValueChange={(value) => {
              if (value) {
                setSelectedDepartment(value)
                setValue('department', value)
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择部门" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.department && (
            <p className="text-sm text-red-500">{errors.department.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="team">班组</Label>
          <Input
            id="team"
            placeholder="请输入班组"
            {...register('team')}
          />
        </div>
      </div>

      {selectedDepartment === '其他' && (
        <div className="space-y-2">
          <Label htmlFor="custom_department">自定义部门</Label>
          <Input
            id="custom_department"
            placeholder="请输入部门名称"
            {...register('custom_department')}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="position">职位</Label>
        <Select
          value={selectedPosition}
          onValueChange={(value) => {
            if (value) {
              setSelectedPosition(value)
              setValue('position', value)
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="请选择职位" />
          </SelectTrigger>
          <SelectContent>
            {POSITIONS.map((pos) => (
              <SelectItem key={pos} value={pos}>
                {pos}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.position && (
          <p className="text-sm text-red-500">{errors.position.message}</p>
        )}
      </div>

      {selectedPosition === '其他' && (
        <div className="space-y-2">
          <Label htmlFor="custom_position">自定义职位</Label>
          <Input
            id="custom_position"
            placeholder="请输入职位名称"
            {...register('custom_position')}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="leave_date">离职日期</Label>
          <Input
            id="leave_date"
            type="date"
            {...register('leave_date')}
          />
          {errors.leave_date && (
            <p className="text-sm text-red-500">{errors.leave_date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="employment_duration">在职时长(月)</Label>
          <Input
            id="employment_duration"
            type="number"
            placeholder="请输入在职时长"
            {...register('employment_duration', { valueAsNumber: true })}
          />
          {errors.employment_duration && (
            <p className="text-sm text-red-500">{errors.employment_duration.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="leave_reason">离职原因</Label>
        <Select
          value={selectedLeaveReason}
          onValueChange={(value) => {
            if (value) {
              setSelectedLeaveReason(value)
              setValue('leave_reason', value)
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="请选择离职原因" />
          </SelectTrigger>
          <SelectContent>
            {LEAVE_REASONS.map((reason) => (
              <SelectItem key={reason} value={reason}>
                {reason}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.leave_reason && (
          <p className="text-sm text-red-500">{errors.leave_reason.message}</p>
        )}
      </div>

      {selectedLeaveReason === '其他' && (
        <div className="space-y-2">
          <Label htmlFor="custom_leave_reason">自定义离职原因</Label>
          <Input
            id="custom_leave_reason"
            placeholder="请输入离职原因"
            {...register('custom_leave_reason')}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '保存中...' : '保存修改'}
        </Button>
      </div>
    </form>
  )
}
