# 腾讯问卷集成设计文档

## 概述

将现有本地问卷系统改造为腾讯问卷集成模式，支持通过邮件发送问卷链接和二维码，并支持导入问卷数据。

## 需求总结

1. HR 在腾讯问卷创建问卷后，将链接录入系统
2. 系统生成二维码，通过邮件发送给离职员工
3. 员工扫码填写问卷（数据存储在腾讯问卷）
4. HR 可从腾讯问卷导出数据，上传到系统进行统计分析
5. 移除本地问卷编辑和填写功能

---

## 重要提示：腾讯问卷创建要求

**HR 在腾讯问卷创建问卷时，必须添加以下必填题：**

| 题目 | 类型 | 必填 | 用途 |
|------|------|------|------|
| 姓名 | 单行文本 | ✅ 必填 | 导入时匹配员工身份 |
| 手机号 | 单行文本 | ✅ 必填 | 导入时匹配员工身份（备用） |

**系统提示**：在录入问卷链接的页面，将**明显展示**以下提示信息：

> ⚠️ **重要提示**
>
> 请确保在腾讯问卷中已添加以下**必填题**，否则导入数据时无法匹配员工身份：
> - **姓名**（单行文本，必填）
> - **手机号**（单行文本，必填）
>
> 这两个题目用于将问卷回答关联到对应的离职员工。

---

## 数据结构变更

### questionnaires 表

| 字段 | 类型 | 变更说明 |
|------|------|----------|
| id | uuid | 不变 |
| title | string | 不变 |
| description | string | 不变 |
| questions | Json | 改为可选，腾讯问卷类型时为 null |
| status | enum | 不变 |
| created_at | timestamp | 不变 |
| **external_url** | string | **新增**，腾讯问卷链接 |
| **external_type** | string | **新增**，枚举：`'tencent'` 或 null |
| **email_subject** | string | **新增**，自定义邮件主题 |
| **email_body** | string | **新增**，自定义邮件正文 |

### 新增字段 SQL

```sql
ALTER TABLE questionnaires
ADD COLUMN external_url TEXT,
ADD COLUMN external_type TEXT,
ADD COLUMN email_subject TEXT,
ADD COLUMN email_body TEXT;

COMMENT ON COLUMN questionnaires.external_url IS '外部问卷链接';
COMMENT ON COLUMN questionnaires.external_type IS '外部问卷类型：tencent 或 null';
COMMENT ON COLUMN questionnaires.email_subject IS '自定义邮件主题';
COMMENT ON COLUMN questionnaires.email_body IS '自定义邮件正文';
```

---

## 组件改造

### 删除的组件

| 组件 | 路径 | 原因 |
|------|------|------|
| QuestionEditor | `components/questionnaires/question-editor.tsx` | 不再需要本地编辑问题 |
| SurveyForm | `components/questionnaires/survey-form.tsx` | 不再需要本地填写问卷 |

### 删除的页面

| 页面 | 路径 | 原因 |
|------|------|------|
| 员工填写页 | `app/survey/[token]/page.tsx` | 员工在腾讯问卷填写 |

### 改造的组件

#### QuestionnaireForm

**路径**：`components/questionnaires/questionnaire-form.tsx`

**改动**：
- 移除 `QuestionEditor` 引用
- 新增"问卷链接"输入框（必填）
- 新增"问卷类型"选择（默认腾讯问卷）
- 移除问题列表相关逻辑
- **新增醒目提示框**：提醒 HR 在腾讯问卷中添加"姓名"、"手机号"必填题

#### QuestionnaireDetail

**路径**：`components/questionnaires/questionnaire-detail.tsx`

**改动**：
- 移除"问题列表"标签页
- 新增"问卷链接"展示区域
- 新增二维码预览和下载功能
- 发送邮件时生成二维码附件

### 新增组件

#### EmailPreview

**路径**：`components/questionnaires/email-preview.tsx`

**功能**：
- 左侧：邮件模板编辑区（主题 + 正文）
- 右侧：实时预览区（变量替换后的效果）
- 支持使用变量占位符
- 支持保存为默认模板
- 支持重置为系统默认

#### SurveyDataImport

**路径**：`components/questionnaires/survey-data-import.tsx`

**功能**：
- 上传 Excel/CSV 文件
- 解析文件内容
- 匹配员工信息（按姓名或手机号）
- 预览导入数据
- 确认导入到 survey_responses 表

---

## 发送流程

### 流程图

```
HR 选择员工
    ↓
点击"发送邮件"
    ↓
后端生成二维码图片（基于 external_url）
    ↓
构建邮件内容：
  - 问卷标题
  - 问卷说明
  - 问卷链接
  - 二维码图片附件
    ↓
发送到员工邮箱
    ↓
记录发送日志
```

### 二维码生成

**依赖库**：`qrcode`

**实现**：
```typescript
import QRCode from 'qrcode'

async function generateQRCodeImage(url: string): Promise<Buffer> {
  return await QRCode.toBuffer(url, {
    type: 'png',
    width: 300,
    margin: 2,
  })
}
```

### 邮件模板管理

#### 功能说明

- 发送邮件前可预览邮件效果
- 支持自定义邮件主题和正文
- 支持使用变量占位符
- 模板可保存为默认模板

#### 变量占位符

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `{员工姓名}` | 收件员工姓名 | 张三 |
| `{问卷标题}` | 问卷标题 | 离职员工回访问卷 |
| `{问卷链接}` | 腾讯问卷链接 | https://wj.qq.com/xxx |
| `{公司名称}` | 当前登录用户所属公司 | XX公司 |
| `{日期}` | 发送日期 | 2026年4月22日 |

#### 默认邮件模板

**主题**：`【离职回访】{问卷标题}`

**正文**：
```
尊敬的 {员工姓名}：

您好！感谢您在职期间的辛勤付出。

为了更好地了解您的离职原因和后续发展情况，我们诚挚邀请您填写以下问卷：

问卷标题：{问卷标题}
问卷链接：{问卷链接}

您也可以扫描下方二维码填写：

[二维码图片]

感谢您的配合！

{公司名称}
{日期}
```

#### 邮件预览组件

**路径**：`components/questionnaires/email-preview.tsx`

**功能**：
- 左侧：邮件模板编辑区（主题 + 正文）
- 右侧：实时预览区（显示替换变量后的效果）
- 支持保存为默认模板
- 支持重置为系统默认

#### 数据存储

在 `questionnaires` 表新增字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| email_subject | TEXT | 自定义邮件主题 |
| email_body | TEXT | 自定义邮件正文 |

### 发送流程

```
HR 选择员工
    ↓
点击"发送邮件"
    ↓
弹出邮件预览对话框：
  - 左侧：编辑邮件主题和正文
  - 右侧：实时预览（变量已替换）
  - 底部：二维码预览
    ↓
HR 确认或调整邮件内容
    ↓
点击"确认发送"
    ↓
后端生成二维码图片（基于 external_url）
    ↓
构建邮件并发送到员工邮箱
    ↓
记录发送日志
```

---

## 数据导入流程

### 流程图

```
HR 从腾讯问卷导出 Excel/CSV
    ↓
在系统"数据导入"页面上传文件
    ↓
解析文件，识别列：
  - 员工标识（姓名/手机号/工号）
  - 问卷答案列
    ↓
匹配员工信息
    ↓
预览匹配结果（成功/失败）
    ↓
确认导入
    ↓
存入 survey_responses 表
```

### 腾讯问卷导出格式

腾讯问卷导出的 CSV/Excel 文件包含以下列：

| 列名 | 说明 | 示例值 |
|------|------|--------|
| 编号 | 答卷序号 | 2 |
| 开始答题时间 | 答题开始时间 | 2026/4/22 15:20 |
| 结束答题时间 | 答题结束时间 | 2026/4/22 15:21 |
| 答题时长 | 答题用时（秒） | 20 |
| 1.您的姓名 | 员工姓名（题目编号+标题） | 张三 |
| 2.您的手机号码 | 员工手机号（可能有制表符前缀） | 13812345678 |
| 3.xxx | 问卷题目（编号+标题） | A.已找到新工作 |
| 语言 | 答题语言 | 简体中文 |
| 地理位置xxx | 地理位置 | 中国/江苏省/苏州市 |
| IP | 答题IP | 2409:8924:xxx |
| UA | 浏览器标识 | Mozilla/5.0... |

**注意事项**：
- 题目列名格式为 `编号.题目标题`（如 `1.您的姓名`）
- 手机号列可能包含制表符前缀，需清洗
- 选项答案格式为 `选项字母.选项内容`（如 `A.已找到新工作`）

### 导入字段映射

| 腾讯问卷导出列 | 系统字段 | 匹配规则 |
|----------------|----------|----------|
| `*.您的姓名`（姓名题） | employee_id | 优先通过姓名匹配 employees 表 |
| `*.您的手机号码`（手机题） | employee_id | 姓名匹配失败时，通过手机号匹配（需清洗制表符） |
| 开始答题时间 | submitted_at | 直接映射 |
| 其他题目列 | answers (JSON) | 存入 answers 字段，key 为题目标题 |

### 员工匹配逻辑

```typescript
async function matchEmployee(row: ImportRow): Promise<string | null> {
  // 1. 获取姓名（匹配 "X.您的姓名" 列）
  const nameColumn = Object.keys(row).find(key => key.includes('您的姓名'))
  const name = nameColumn ? row[nameColumn]?.trim() : null

  // 2. 获取手机号（匹配 "X.您的手机号码" 列，清洗制表符）
  const phoneColumn = Object.keys(row).find(key => key.includes('您的手机号码'))
  const phone = phoneColumn ? row[phoneColumn]?.trim().replace(/\t/g, '') : null

  // 3. 优先通过姓名匹配
  if (name) {
    const byName = await findEmployeeByName(name)
    if (byName) return byName.id
  }

  // 4. 通过手机号匹配
  if (phone) {
    const byPhone = await findEmployeeByPhone(phone)
    if (byPhone) return byPhone.id
  }

  // 5. 匹配失败，返回 null
  return null
}
```

### 答案解析逻辑

```typescript
function parseAnswers(row: ImportRow): Record<string, string> {
  const answers: Record<string, string> = {}

  // 跳过系统列和身份识别列
  const skipColumns = ['编号', '开始答题时间', '结束答题时间', '答题时长', '语言', '清洗数据', '地理位置', 'IP', 'UA', 'Referrer', '您的姓名', '您的手机号码']

  for (const [key, value] of Object.entries(row)) {
    // 跳过系统列
    if (skipColumns.some(skip => key.includes(skip))) continue

    // 提取题目标题（去掉编号前缀）
    const questionTitle = key.replace(/^\d+\./, '').trim()

    // 提取答案内容（去掉选项字母前缀，如 "A.已找到新工作" -> "已找到新工作"）
    const answerValue = value?.replace(/^[A-Z]\./, '').trim() || ''

    answers[questionTitle] = answerValue
  }

  return answers
}
```

### 导入状态

- `submit_channel` 设为 `'manual'`（手动导入）

---

## API 变更

### 新增 API

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/questionnaires/[id]/qrcode` | GET | 生成问卷二维码图片 |
| `/api/questionnaires/[id]/import` | POST | 导入问卷数据 |

### 修改 API

| 路径 | 方法 | 变更 |
|------|------|------|
| `/api/questionnaires` | POST | 支持 external_url 和 external_type |
| `/api/questionnaires/[id]` | PUT | 支持 external_url 和 external_type |

### 删除 API

| 路径 | 方法 | 原因 |
|------|------|------|
| `/api/survey/[token]` | GET/POST | 不再需要本地填写 |

---

## 实施步骤

### 第一阶段：数据结构变更

1. 添加数据库字段 `external_url`、`external_type`
2. 更新类型定义 `types/questionnaire.ts`
3. 更新数据库操作函数 `lib/db/questionnaires.ts`

### 第二阶段：组件改造

1. 改造 `QuestionnaireForm` 组件
2. 改造 `QuestionnaireDetail` 组件
3. 删除 `QuestionEditor`、`SurveyForm` 组件
4. 删除 `app/survey/[token]` 页面

### 第三阶段：二维码生成

1. 安装 `qrcode` 依赖
2. 实现二维码生成函数
3. 添加二维码 API 路由
4. 集成到邮件发送流程

### 第四阶段：数据导入

1. 创建 `SurveyDataImport` 组件
2. 实现文件解析逻辑
3. 实现员工匹配逻辑
4. 添加导入 API 路由

### 第五阶段：清理与测试

1. 清理旧数据（提供备份导出）
2. 更新相关页面路由
3. 端到端测试

---

## 文件变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `lib/qrcode.ts` | 二维码生成工具函数 |
| `lib/import/survey-data.ts` | 问卷数据导入解析 |
| `components/questionnaires/email-preview.tsx` | 邮件预览和编辑组件 |
| `components/questionnaires/survey-data-import.tsx` | 数据导入组件 |
| `app/api/questionnaires/[id]/qrcode/route.ts` | 二维码 API |
| `app/api/questionnaires/[id]/import/route.ts` | 导入 API |

### 修改文件

| 文件 | 变更 |
|------|------|
| `types/questionnaire.ts` | 添加 external_url、external_type |
| `types/database.ts` | 更新 questionnaires 表类型 |
| `lib/db/questionnaires.ts` | 支持新字段 |
| `lib/actions/questionnaires.ts` | 支持新字段，集成二维码 |
| `lib/email.ts` | 支持附件发送 |
| `components/questionnaires/questionnaire-form.tsx` | 改为链接输入 |
| `components/questionnaires/questionnaire-detail.tsx` | 移除问题列表，添加二维码 |
| `components/questionnaires/questionnaire-list.tsx` | 显示问卷类型标识 |

### 删除文件

| 文件 | 原因 |
|------|------|
| `components/questionnaires/question-editor.tsx` | 不再需要 |
| `components/questionnaires/survey-form.tsx` | 不再需要 |
| `app/survey/[token]/page.tsx` | 不再需要 |

---

## 风险与注意事项

1. **旧数据处理**：现有本地问卷数据需要导出备份后清理
2. **邮件附件大小**：二维码图片需控制大小（建议 300x300）
3. **导入数据匹配**：需明确匹配规则，避免重复导入
4. **腾讯问卷格式**：需测试腾讯问卷导出格式，确保解析正确
