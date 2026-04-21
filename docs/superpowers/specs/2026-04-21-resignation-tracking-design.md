# 离职人员动态跟踪系统设计文档

> 创建日期: 2026-04-21

## 1. 项目概述

### 1.1 背景
HR部门需要对近两年离职员工进行回访跟踪，了解离职后情况，分析数据并生成报告，为员工保有策略提供决策支持。

### 1.2 目标用户
- **HR专员**: 执行回访、录入数据、生成报告
- **HR管理者**: 查看分析报告和决策建议
- **离职员工**: 通过问卷链接填写回访信息

### 1.3 核心功能
1. 离职员工信息管理（手动录入 + Excel导入）
2. 自定义问卷设计与发放
3. 回访计划管理与自动提醒
4. 多维度数据分析
5. 报告生成与多格式导出

---

## 2. 技术方案

### 2.1 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | Next.js 14 (App Router) | React全栈框架，SSR/SSG支持 |
| UI组件 | shadcn/ui + Radix UI | 现代化组件库，高级感设计 |
| 样式 | Tailwind CSS | 原子化CSS，快速开发 |
| 图表 | Recharts | React图表库 |
| 表单 | React Hook Form + Zod | 表单处理与验证 |
| 后端服务 | Supabase | PostgreSQL + Auth + Storage |
| 认证 | Supabase Auth | 密码登录 + OAuth |
| 报告生成 | @react-pdf/renderer + docx | PDF和Word导出 |

### 2.2 架构图

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js 应用                         │
├─────────────────────────────────────────────────────────┤
│  页面层 (app/)                                          │
│  ├── Server Components (数据获取、SEO)                  │
│  └── Client Components (交互、状态)                     │
├─────────────────────────────────────────────────────────┤
│  API层 (app/api/)                                       │
│  ├── Route Handlers (REST API)                          │
│  └── Server Actions (表单提交)                          │
├─────────────────────────────────────────────────────────┤
│  服务层 (lib/)                                          │
│  ├── supabase (数据库操作)                              │
│  ├── auth (认证逻辑)                                    │
│  └── report (报告生成)                                  │
└─────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│                     Supabase                            │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL (数据存储)                                  │
│  Auth (用户认证 + OAuth)                                │
│  Storage (文件存储)                                     │
│  Realtime (实时订阅)                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 数据模型

### 3.1 表结构

#### employees (离职员工)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | text | 姓名 |
| phone | text | 手机号 |
| email | text | 邮箱 |
| department | text | 原部门 |
| position | text | 原职位 |
| leave_date | date | 离职日期 |
| leave_reason | text | 离职原因 |
| employment_duration | integer | 在职时长(月) |
| reporter_id | uuid | 负责HR |
| status | text | 状态(pending/followed) |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

#### questionnaires (问卷)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| title | text | 问卷标题 |
| description | text | 问卷描述 |
| questions | jsonb | 题目数组 |
| status | text | 状态(draft/active/archived) |
| created_at | timestamp | 创建时间 |

#### survey_responses (问卷回答)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| employee_id | uuid | 员工ID |
| questionnaire_id | uuid | 问卷ID |
| answers | jsonb | 答案数组 |
| submit_channel | text | 提交渠道(survey/manual) |
| submitted_at | timestamp | 提交时间 |

#### follow_up_plans (回访计划)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| employee_id | uuid | 员工ID |
| plan_date | date | 计划回访日期 |
| follow_up_type | text | 类型(1m/3m/6m/custom) |
| status | text | 状态(pending/completed/overdue) |
| reminder_sent | boolean | 是否已提醒 |
| created_at | timestamp | 创建时间 |

#### follow_up_records (回访记录)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| plan_id | uuid | 计划ID |
| employee_id | uuid | 员工ID |
| contact_method | text | 联系方式(phone/wechat/email) |
| contact_result | text | 联系结果(connected/no_answer/refused) |
| new_company | text | 新公司 |
| new_position | text | 新职位 |
| salary_change | text | 薪资变化(increase/decrease/same) |
| personal_feeling | text | 个人感受 |
| suggestions | text | 对公司建议 |
| created_at | timestamp | 创建时间 |

#### reports (报告)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| title | text | 报告标题 |
| type | text | 报告类型 |
| filters | jsonb | 筛选条件 |
| content | jsonb | 报告数据 |
| created_at | timestamp | 创建时间 |

### 3.2 关系图

```
employees ──┬──< survey_responses >── questionnaires
            │
            ├──< follow_up_plans >──< follow_up_records
            │
            └──< reports
```

---

## 4. 页面设计

### 4.1 路由结构

| 路由 | 页面 | 权限 |
|------|------|------|
| /login | 登录页 | 公开 |
| /dashboard | 仪表盘 | 登录用户 |
| /employees | 离职员工列表 | HR专员/管理者 |
| /employees/add | 新增员工 | HR专员 |
| /employees/[id] | 员工详情 | HR专员/管理者 |
| /employees/import | 批量导入 | HR专员 |
| /questionnaires | 问卷列表 | HR专员/管理者 |
| /questionnaires/create | 创建问卷 | HR专员 |
| /questionnaires/[id] | 问卷编辑 | HR专员 |
| /survey/[token] | 填写问卷 | 公开(令牌验证) |
| /follow-ups | 回访计划列表 | HR专员/管理者 |
| /follow-ups/[id] | 回访详情 | HR专员 |
| /analytics | 数据分析 | HR管理者 |
| /analytics/trends | 趋势分析 | HR管理者 |
| /analytics/insights | 深度洞察 | HR管理者 |
| /reports | 报告中心 | HR专员/管理者 |
| /reports/generate | 生成报告 | HR专员 |
| /reports/[id] | 报告详情 | HR专员/管理者 |
| /settings | 系统设置 | 管理者 |
| /settings/users | 用户管理 | 管理者 |
| /settings/oauth | OAuth配置 | 管理者 |

### 4.2 核心页面功能

#### 仪表盘 (/dashboard)
- 离职员工总数、回访完成率、问卷回收率
- 近期待回访提醒列表
- 离职原因分布饼图
- 离职趋势折线图

#### 离职员工管理 (/employees)
- 列表展示：姓名、部门、职位、离职日期、状态
- 筛选：部门、时间范围、回访状态
- 操作：新增、导入、查看详情、发送问卷

#### 问卷管理 (/questionnaires)
- 问卷列表：标题、状态、创建时间
- 问卷编辑器：拖拽式题目编排
- 题型支持：单选、多选、填空、评分

#### 回访管理 (/follow-ups)
- 计划列表：员工、计划日期、状态
- 提醒机制：邮件/系统通知
- 回访录入：表单记录回访结果

#### 数据分析 (/analytics)
- 基础统计：离职原因分布、去向分布、薪资变化
- 趋势分析：按月/季/年离职率变化
- 深度洞察：部门差异、在职时长关联分析

#### 报告中心 (/reports)
- 报告模板选择
- 数据范围筛选
- 导出格式：PDF、Word、在线查看

---

## 5. 认证方案

### 5.1 登录方式
1. **账号密码登录**: Supabase Auth 默认支持
2. **企业微信扫码**: OAuth 2.0 集成
3. **钉钉扫码**: OAuth 2.0 集成

### 5.2 角色权限
- **admin**: 全部权限
- **hr_manager**: 查看、分析、报告
- **hr_staff**: 录入、回访、报告

---

## 6. 开发计划

### Phase 1: 基础框架 (2天)
- [ ] Next.js 项目初始化
- [ ] Supabase 项目配置
- [ ] shadcn/ui 组件安装
- [ ] 认证模块实现
- [ ] 基础布局组件

### Phase 2: 核心功能 (3天)
- [ ] 离职员工管理模块
- [ ] 问卷设计与发放
- [ ] 回访计划管理

### Phase 3: 分析报告 (2天)
- [ ] 数据分析图表
- [ ] 报告生成与导出

### Phase 4: 优化完善 (1天)
- [ ] 回访提醒功能
- [ ] OAuth集成
- [ ] UI细节优化

---

## 7. 非功能性需求

### 7.1 性能
- 页面首屏加载 < 2s
- 列表分页加载，每页20条
- 图表数据缓存

### 7.2 安全
- 问卷链接使用一次性令牌
- 敏感操作需二次确认
- API请求频率限制

### 7.3 兼容性
- 浏览器: Chrome、Firefox、Safari、Edge 最新版
- 响应式设计支持平板访问
