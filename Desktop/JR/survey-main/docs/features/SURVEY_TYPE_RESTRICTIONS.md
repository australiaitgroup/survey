# Survey Type Restrictions Implementation

## 概述

实现了 survey type 的限制功能，确保当调查类型为 'survey' 时，只能使用手动添加问题的方式，不能选择 Question Bank。

## 功能特性

### 前端限制

1. **类型选择联动**
    - 当用户选择 survey type 时，自动将 sourceType 设置为 'manual'
    - 清除 questionBankId 和 questionCount 设置

2. **UI 禁用**
    - Question Source 选择框在 survey type 时被禁用
    - Question Bank 选项在 survey type 时被禁用
    - 显示警告信息说明限制

3. **用户提示**
    - 当选择 survey type 时显示："Survey type only supports manual question creation"
    - 如果尝试使用 question bank，显示错误提示

### 后端验证

1. **模式验证**
    - 在 `surveyCreateSchema` 中添加了 `.refine()` 验证
    - 检查 `type === 'survey' && sourceType === 'question_bank'` 的组合
    - 如果违反规则，返回错误信息："Survey type cannot use question banks. Please use manual question creation."

## 实现细节

### 前端代码修改

**文件**: `client/src/Admin.tsx`

1. **类型选择处理**:

```typescript
onChange={e => {
    const newType = e.target.value as 'survey' | 'assessment' | 'quiz' | 'iq';
    setNewSurvey({
        ...newSurvey,
        type: newType,
        // If switching to survey type, force sourceType to manual
        sourceType: newType === 'survey' ? 'manual' : newSurvey.sourceType,
        // Clear question bank settings if switching to survey
        questionBankId: newType === 'survey' ? undefined : newSurvey.questionBankId,
        questionCount: newType === 'survey' ? undefined : newSurvey.questionCount,
    });
}}
```

2. **Question Source 选择框**:

```typescript
<select
    className="input-field"
    value={newSurvey.sourceType}
    onChange={e => setNewSurvey({...})}
    disabled={newSurvey.type === 'survey'}
>
    <option value="manual">Manual - Add questions individually</option>
    <option
        value="question_bank"
        disabled={newSurvey.type === 'survey'}
    >
        Question Bank - Random selection from existing bank
    </option>
</select>
```

3. **用户提示信息**:

```typescript
<div className="text-xs text-gray-500 mt-1">
    {newSurvey.type === 'survey'
        ? 'Survey type only supports manual question creation'
        : newSurvey.sourceType === 'manual'
            ? 'Add questions one by one to this survey'
            : 'Select questions randomly from a question bank'
    }
</div>
```

### 后端代码修改

**文件**: `schemas/surveySchemas.js`

添加验证规则:

```javascript
.refine(
    data => {
        // Validate that survey type cannot use question banks
        if (data.type === SURVEY_TYPE.SURVEY && data.sourceType === 'question_bank') {
            return false;
        }
        return true;
    },
    {
        message: 'Survey type cannot use question banks. Please use manual question creation.',
    }
)
```

## 测试

### 测试脚本

创建了 `test_survey_type_restrictions.js` 来验证功能:

1. **测试 1**: 创建 survey type + manual source (应该成功)
2. **测试 2**: 创建 survey type + question bank source (应该失败)
3. **测试 3**: 创建 assessment type + question bank source (应该成功)

### 手动测试步骤

1. 打开管理员页面
2. 点击 "Create Survey"
3. 选择 Type 为 "Survey"
4. 观察 Question Source 选择框被禁用
5. 尝试选择 "Question Bank" - 应该被禁用
6. 切换到其他类型 (Quiz/Assessment/IQ) - Question Bank 选项应该可用

## 预期行为

### Survey Type

- ✅ 只能使用 Manual 方式添加问题
- ❌ 不能使用 Question Bank
- ✅ 自动禁用 Question Bank 选项
- ✅ 显示相应的提示信息

### Assessment/Quiz/IQ Types

- ✅ 可以使用 Manual 方式
- ✅ 可以使用 Question Bank 方式
- ✅ 所有选项都可用

## 错误处理

### 前端错误

- 如果用户尝试通过其他方式设置 survey + question bank，显示警告信息
- 自动重置为 manual 模式

### 后端错误

- 如果 API 请求包含 survey + question bank，返回 400 错误
- 错误信息: "Survey type cannot use question banks. Please use manual question creation."

## 兼容性

- 不影响现有的 survey 数据
- 不影响其他类型的调查创建
- 向后兼容现有的 API 调用
