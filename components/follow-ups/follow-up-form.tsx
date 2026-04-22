'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CONTACT_METHODS,
  CONTACT_RESULTS,
  SALARY_CHANGES,
} from '@/types/follow-up'

const formSchema = z.object({
  contact_method: z.string(),
  contact_result: z.string(),
  new_company: z.string(),
  new_position: z.string(),
  salary_change: z.string(),
  personal_feeling: z.string(),
  suggestions: z.string(),
})

type FormValues = z.infer<typeof formSchema>

interface FollowUpFormProps {
  onSubmit: (data: FormValues) => Promise<void>
  isLoading?: boolean
}

const getLabel = (items: readonly { value: string; label: string }[], value: string): string => {
  const found = items.find(item => item.value === value)
  return found ? found.label : value
}

export function FollowUpForm({ onSubmit, isLoading }: FollowUpFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contact_method: 'phone',
      contact_result: 'connected',
      new_company: '',
      new_position: '',
      salary_change: 'same',
      personal_feeling: '',
      suggestions: '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contact_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>联系方式</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue>{getLabel(CONTACT_METHODS, field.value)}</SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONTACT_METHODS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_result"
            render={({ field }) => (
              <FormItem>
                <FormLabel>联系结果</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue>{getLabel(CONTACT_RESULTS, field.value)}</SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONTACT_RESULTS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="new_company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>新公司</FormLabel>
                <FormControl>
                  <Input placeholder="请输入新公司名称" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="new_position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>新职位</FormLabel>
                <FormControl>
                  <Input placeholder="请输入新职位" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="salary_change"
          render={({ field }) => (
            <FormItem>
              <FormLabel>薪资变化</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue>{getLabel(SALARY_CHANGES, field.value)}</SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SALARY_CHANGES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="personal_feeling"
          render={({ field }) => (
            <FormItem>
              <FormLabel>个人感受</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请记录员工的个人感受和状态"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="suggestions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>对公司建议</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请记录员工对公司的建议"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? '提交中...' : '提交回访记录'}
        </Button>
      </form>
    </Form>
  )
}
