'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EmployeeFormData } from '@/types/employee'
import type { Database } from '@/types/database'

type EmployeeInsert = Database['public']['Tables']['employees']['Insert']
type FollowUpPlanInsert = Database['public']['Tables']['follow_up_plans']['Insert']

/**
 * 创建员工
 */
export async function createEmployeeAction(
  employeeData: EmployeeFormData
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient()
    const insertData: EmployeeInsert = {
      name: employeeData.name,
      phone: employeeData.phone || null,
      email: employeeData.email || null,
      department: employeeData.department || null,
      position: employeeData.position || null,
      leave_date: employeeData.leave_date || null,
      leave_reason: employeeData.leave_reason || null,
      employment_duration: employeeData.employment_duration || null,
      status: 'pending',
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = (await supabase
      .from('employees')
      .insert(insertData as any)
      .select()
      .single()) as any

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/employees')
    return { success: true, data: { id: data.id } }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * 创建默认回访计划
 */
export async function createDefaultFollowUpPlansAction(
  employeeId: string,
  leaveDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient()
    const leaveDateObj = new Date(leaveDate)

    const followUpConfigs = [
      { type: '1m' as const, months: 1 },
      { type: '3m' as const, months: 3 },
      { type: '6m' as const, months: 6 },
    ]

    for (const config of followUpConfigs) {
      const planDate = new Date(leaveDateObj)
      planDate.setMonth(planDate.getMonth() + config.months)

      const insertData: FollowUpPlanInsert = {
        employee_id: employeeId,
        plan_date: planDate.toISOString().split('T')[0],
        follow_up_type: config.type,
        status: 'pending',
        reminder_sent: false,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('follow_up_plans').insert(insertData as any)

      if (error) {
        return { success: false, error: error.message }
      }
    }

    revalidatePath('/follow-ups')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * 批量导入员工
 */
export async function importEmployeesAction(
  employees: Array<EmployeeFormData>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const supabase = await createSupabaseServerClient()
  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (const [index, employee] of employees.entries()) {
    try {
      const insertData: EmployeeInsert = {
        name: employee.name,
        phone: employee.phone || null,
        email: employee.email || null,
        department: employee.department || null,
        position: employee.position || null,
        leave_date: employee.leave_date || null,
        leave_reason: employee.leave_reason || null,
        employment_duration: employee.employment_duration || null,
        status: 'pending',
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('employees').insert(insertData as any)

      if (error) {
        results.failed++
        results.errors.push(`第${index + 1}行: ${error.message}`)
      } else {
        results.success++
      }
    } catch (err) {
      results.failed++
      results.errors.push(`第${index + 1}行: ${(err as Error).message}`)
    }
  }

  revalidatePath('/employees')
  return results
}
