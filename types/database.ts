/**
 * Supabase 数据库类型定义
 * 基于 PostgreSQL 表结构自动生成
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // 离职员工表
      employees: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string | null
          department: string | null
          team: string | null
          position: string | null
          leave_date: string | null
          leave_reason: string | null
          employment_duration: number | null
          reporter_id: string | null
          status: 'pending' | 'followed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email?: string | null
          department?: string | null
          team?: string | null
          position?: string | null
          leave_date?: string | null
          leave_reason?: string | null
          employment_duration?: number | null
          reporter_id?: string | null
          status?: 'pending' | 'followed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string | null
          department?: string | null
          team?: string | null
          position?: string | null
          leave_date?: string | null
          leave_reason?: string | null
          employment_duration?: number | null
          reporter_id?: string | null
          status?: 'pending' | 'followed'
          created_at?: string
          updated_at?: string
        }
      }
      // 问卷表
      questionnaires: {
        Row: {
          id: string
          title: string
          description: string | null
          questions: Json
          status: 'draft' | 'active' | 'archived'
          created_at: string
          external_url: string | null
          external_type: string | null
          email_subject: string | null
          email_body: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          questions?: Json
          status?: 'draft' | 'active' | 'archived'
          created_at?: string
          external_url?: string | null
          external_type?: string | null
          email_subject?: string | null
          email_body?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          questions?: Json
          status?: 'draft' | 'active' | 'archived'
          created_at?: string
          external_url?: string | null
          external_type?: string | null
          email_subject?: string | null
          email_body?: string | null
        }
      }
      // 问卷回答表
      survey_responses: {
        Row: {
          id: string
          employee_id: string | null
          questionnaire_id: string | null
          answers: Json
          submit_channel: 'survey' | 'manual'
          submitted_at: string
        }
        Insert: {
          id?: string
          employee_id?: string | null
          questionnaire_id?: string | null
          answers?: Json
          submit_channel?: 'survey' | 'manual'
          submitted_at?: string
        }
        Update: {
          id?: string
          employee_id?: string | null
          questionnaire_id?: string | null
          answers?: Json
          submit_channel?: 'survey' | 'manual'
          submitted_at?: string
        }
      }
      // 回访计划表
      follow_up_plans: {
        Row: {
          id: string
          employee_id: string | null
          plan_date: string | null
          follow_up_type: '1m' | '3m' | '6m' | 'custom'
          status: 'pending' | 'completed' | 'overdue'
          reminder_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          employee_id?: string | null
          plan_date?: string | null
          follow_up_type?: '1m' | '3m' | '6m' | 'custom'
          status?: 'pending' | 'completed' | 'overdue'
          reminder_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string | null
          plan_date?: string | null
          follow_up_type?: '1m' | '3m' | '6m' | 'custom'
          status?: 'pending' | 'completed' | 'overdue'
          reminder_sent?: boolean
          created_at?: string
        }
      }
      // 回访记录表
      follow_up_records: {
        Row: {
          id: string
          plan_id: string | null
          employee_id: string | null
          contact_method: 'phone' | 'wechat' | 'email'
          contact_result: 'connected' | 'no_answer' | 'refused'
          new_company: string | null
          new_position: string | null
          salary_change: 'increase' | 'decrease' | 'same' | null
          personal_feeling: string | null
          suggestions: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_id?: string | null
          employee_id?: string | null
          contact_method?: 'phone' | 'wechat' | 'email'
          contact_result?: 'connected' | 'no_answer' | 'refused'
          new_company?: string | null
          new_position?: string | null
          salary_change?: 'increase' | 'decrease' | 'same' | null
          personal_feeling?: string | null
          suggestions?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string | null
          employee_id?: string | null
          contact_method?: 'phone' | 'wechat' | 'email'
          contact_result?: 'connected' | 'no_answer' | 'refused'
          new_company?: string | null
          new_position?: string | null
          salary_change?: 'increase' | 'decrease' | 'same' | null
          personal_feeling?: string | null
          suggestions?: string | null
          created_at?: string
        }
      }
      // 报告表
      reports: {
        Row: {
          id: string
          title: string
          type: string
          filters: Json | null
          content: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          type: string
          filters?: Json | null
          content?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          type?: string
          filters?: Json | null
          content?: Json | null
          created_at?: string
        }
      }
      // 问卷令牌表
      survey_tokens: {
        Row: {
          id: string
          token: string
          employee_id: string | null
          questionnaire_id: string | null
          used: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          token: string
          employee_id?: string | null
          questionnaire_id?: string | null
          used?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          employee_id?: string | null
          questionnaire_id?: string | null
          used?: boolean
          expires_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// 便捷类型导出
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// 具体表类型导出
export type Employee = Tables<'employees'>
export type Questionnaire = Tables<'questionnaires'>
export type SurveyResponse = Tables<'survey_responses'>
export type FollowUpPlan = Tables<'follow_up_plans'>
export type FollowUpRecord = Tables<'follow_up_records'>
export type Report = Tables<'reports'>
export type SurveyToken = Tables<'survey_tokens'>
