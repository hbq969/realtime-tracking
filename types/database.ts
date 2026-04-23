/**
 * 数据库类型定义
 * 重新导出 db.ts 中的类型以保持兼容性
 */

export type {
  Json,
  EmployeeRow,
  EmployeeInsert,
  EmployeeUpdate,
  QuestionnaireRow,
  QuestionnaireInsert,
  QuestionnaireUpdate,
  SurveyTokenRow,
  SurveyTokenInsert,
  SurveyTokenUpdate,
  SurveyResponseRow,
  SurveyResponseInsert,
  SurveyResponseUpdate,
  FollowUpPlanRow,
  FollowUpPlanInsert,
  FollowUpPlanUpdate,
  FollowUpRecordRow,
  FollowUpRecordInsert,
  FollowUpRecordUpdate,
  ReportRow,
  ReportInsert,
  ReportUpdate,
} from './db'

// 为兼容性添加常用类型别名
export type Employee = import('./db').EmployeeRow
export type Questionnaire = import('./db').QuestionnaireRow
export type SurveyToken = import('./db').SurveyTokenRow
export type SurveyResponse = import('./db').SurveyResponseRow
export type FollowUpPlan = import('./db').FollowUpPlanRow
export type FollowUpRecord = import('./db').FollowUpRecordRow
export type Report = import('./db').ReportRow
