'use server'

import { revalidatePath } from 'next/cache'
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  importEmployees as dbImportEmployees,
  type Employee
} from '@/lib/db/employees'
import { createDefaultFollowUpPlans } from '@/lib/db/follow-ups'
import type { EmployeeFormData } from '@/types/employee'

/**
 * 创建员工
 */
export async function createEmployeeAction(
  employeeData: EmployeeFormData
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const employee = await createEmployee(employeeData)
    revalidatePath('/employees')
    return { success: true, data: { id: employee.id } }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * 创建默认回访计划
 * 每个员工只创建一条回访记录
 */
export async function createDefaultFollowUpPlansAction(
  employeeId: string,
  leaveDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await createDefaultFollowUpPlans(employeeId, leaveDate)
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
  const results = await dbImportEmployees(employees)
  revalidatePath('/employees')
  return results
}

/**
 * 更新员工
 */
export async function updateEmployeeAction(
  id: string,
  employeeData: Partial<EmployeeFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateEmployee(id, employeeData)
    revalidatePath('/employees')
    revalidatePath(`/employees/${id}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * 删除员工
 */
export async function deleteEmployeeAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteEmployee(id)
    revalidatePath('/employees')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * 批量删除员工
 */
export async function batchDeleteEmployeesAction(
  ids: string[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (const id of ids) {
    try {
      const result = await deleteEmployeeAction(id)
      if (result.success) {
        results.success++
      } else {
        results.failed++
        results.errors.push(`ID ${id}: ${result.error}`)
      }
    } catch (err) {
      results.failed++
      results.errors.push(`ID ${id}: ${(err as Error).message}`)
    }
  }

  return results
}