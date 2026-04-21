'use client'

import { useState } from 'react'
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
import { LEAVE_REASONS, DEPARTMENTS } from '@/types/employee'

const formSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  phone: z.string().min(1, '请输入手机号'),
  email: z.string().email('请输入有效邮箱'),
  department: z.string().min(1, '请选择部门'),
  position: z.string().min(1, '请输入职位'),
  leave_date: z.string().min(1, '请选择离职日期'),
  leave_reason: z.string().min(1, '请选择离职原因'),
  employment_duration: z.number().min(0, '在职时长不能为负数'),
})

type FormValues = z.infer<typeof formSchema>

interface EmployeeFormProps {
  defaultValues?: Partial<FormValues>
  onSubmit: (data: FormValues) => Promise<void>
  isEdit?: boolean
}

export function EmployeeForm({ defaultValues, onSubmit, isEdit }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState(defaultValues?.department || '')
  const [selectedLeaveReason, setSelectedLeaveReason] = useState(defaultValues?.leave_reason || '')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      department: '',
      position: '',
      leave_date: '',
      leave_reason: '',
      employment_duration: 0,
      ...defaultValues,
    },
  })

  const handleFormSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      await onSubmit(data)
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
          <Label htmlFor="position">职位</Label>
          <Input
            id="position"
            placeholder="请输入职位"
            {...register('position')}
          />
          {errors.position && (
            <p className="text-sm text-red-500">{errors.position.message}</p>
          )}
        </div>
      </div>

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

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '提交中...' : (isEdit ? '保存修改' : '添加员工')}
      </Button>
    </form>
  )
}
