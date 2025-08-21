# 字符串常量重构总结

## 重构目标

将所有condition中出现的字符串转换为常量，提高代码的可维护性和可读性。

## 创建的常量文件

- **文件位置**: `shared/constants.js`
- **包含的常量类型**:
    - 错误消息常量 (`ERROR_MESSAGES`)
    - 状态常量 (`SURVEY_STATUS`)
    - 类型常量 (`SURVEY_TYPE`)
    - 数据类型常量 (`DATA_TYPES`)
    - HTTP状态码常量 (`HTTP_STATUS`)
    - 有效状态数组 (`VALID_STATUSES`)

## 重构的文件列表

### 1. routes/surveys.js

- ✅ 替换了 `'active'` 为 `SURVEY_STATUS.ACTIVE`
- ✅ 替换了 `'Survey not found'` 为 `ERROR_MESSAGES.SURVEY_NOT_FOUND`
- ✅ 替换了 HTTP状态码为 `HTTP_STATUS.*`
- ✅ 替换了状态验证数组为 `VALID_STATUSES`
- ✅ 替换了 `'Invalid status. Must be one of: draft, active, closed'` 为 `ERROR_MESSAGES.INVALID_STATUS`

### 2. routes/admin.js

- ✅ 替换了 `'unauthorized'` 为 `ERROR_MESSAGES.UNAUTHORIZED`
- ✅ 替换了 `'invalid data'` 为 `ERROR_MESSAGES.INVALID_DATA`
- ✅ 替换了 `'invalid correctAnswer'` 为 `ERROR_MESSAGES.INVALID_CORRECT_ANSWER`
- ✅ 替换了 `'Survey not found'` 为 `ERROR_MESSAGES.SURVEY_NOT_FOUND`
- ✅ 替换了 `'string'` 为 `DATA_TYPES.STRING`
- ✅ 替换了 `'number'` 为 `DATA_TYPES.NUMBER`
- ✅ 替换了 HTTP状态码为 `HTTP_STATUS.*`

### 3. routes/questions.js

- ✅ 替换了 `'unauthorized'` 为 `ERROR_MESSAGES.UNAUTHORIZED`
- ✅ 替换了 `'invalid data'` 为 `ERROR_MESSAGES.INVALID_DATA`
- ✅ 替换了 `'string'` 为 `DATA_TYPES.STRING`
- ✅ 替换了 HTTP状态码为 `HTTP_STATUS.*`

### 4. models/Survey.js

- ✅ 替换了 `'survey'` 和 `'assessment'` 为 `SURVEY_TYPE.SURVEY` 和 `SURVEY_TYPE.ASSESSMENT`
- ✅ 替换了 `'draft'`, `'active'`, `'closed'` 为 `SURVEY_STATUS.*`

### 5. middlewares/errorHandler.js

- ✅ 替换了 HTTP状态码为 `HTTP_STATUS.*`

## 重构带来的好处

1. **可维护性提升**: 所有字符串常量集中管理，修改时只需要在一个地方更改
2. **可读性提升**: 使用有意义的常量名称，代码更易理解
3. **拼写错误预防**: 避免手动输入字符串时的拼写错误
4. **IDE支持**: 可以利用IDE的自动完成和重构功能
5. **类型安全**: 在TypeScript项目中可以提供更好的类型检查
6. **一致性**: 确保整个项目中使用的字符串常量保持一致

## 验证

- ✅ 所有文件导入成功
- ✅ 常量文件正常工作
- ✅ 重构后的代码可以正常运行

## 使用方法

在需要使用这些常量的文件中，添加导入语句：

```javascript
const { ERROR_MESSAGES, SURVEY_STATUS, HTTP_STATUS } = require('../shared/constants');
```

然后在代码中使用常量替换硬编码的字符串：

```javascript
// 之前
if (!survey) throw new AppError('Survey not found', 404);

// 之后
if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
```
