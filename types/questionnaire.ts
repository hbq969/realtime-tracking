/**
 * 问卷类型定义
 */

export type QuestionType = 'single' | 'multiple' | 'text' | 'rating'

export interface Question {
  id: string
  type: QuestionType
  title: string
  required: boolean
  options?: string[]
  placeholder?: string
}

export type ExternalType = 'tencent' | null

export interface Questionnaire {
  id: string
  title: string
  description: string
  questions: Question[] | null
  status: 'draft' | 'active' | 'archived'
  created_at: string
  external_url: string | null
  external_type: ExternalType
  email_subject: string | null
  email_body: string | null
}

export interface QuestionnaireFormData {
  title: string
  description?: string
  questions?: Question[]
  external_url?: string
  external_type?: ExternalType
  email_subject?: string
  email_body?: string
}

export interface SurveyToken {
  id: string
  token: string
  employee_id: string
  questionnaire_id: string
  used: boolean
  expires_at: string
  created_at: string
}

export interface SurveyResponse {
  id: string
  employee_id: string
  questionnaire_id: string
  answers: Record<string, string | string[]>
  submit_channel: 'survey' | 'manual'
  submitted_at: string
}

// 邮件模板变量
export interface EmailTemplateVariables {
  '员工姓名': string
  '问卷标题': string
  '问卷链接': string
  '公司名称': string
  '日期': string
}

// 默认邮件模板
export const DEFAULT_EMAIL_SUBJECT = '【离职回访】{问卷标题}'
export const DEFAULT_EMAIL_BODY = `尊敬的 {员工姓名}：

您好！感谢您在职期间的辛勤付出。

为了更好地了解您的离职原因和后续发展情况，我们诚挚邀请您填写以下问卷：

问卷标题：{问卷标题}
问卷链接：{问卷链接}

您也可以扫描下方二维码填写：

[二维码图片]

感谢您的配合！

{公司名称}
{日期}`