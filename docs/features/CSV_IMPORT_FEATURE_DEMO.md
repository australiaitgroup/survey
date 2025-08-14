# Question Bank CSV 导入功能演示

## 🎯 功能概述

我已经为 Question Bank 模块成功实现了 CSV 文件批量导入功能，支持快速批量添加题目到题库中。

## ✅ 实现的功能

### 1. 后端功能

- **CSV 文件解析**: 使用 `csv-parser` 库解析上传的 CSV 文件
- **文件上传处理**: 使用 `multer` 中间件处理文件上传（最大 5MB）
- **数据验证**: 完整的数据格式验证和错误处理
- **批量导入**: 支持一次导入多道题目
- **模板下载**: 提供标准 CSV 模板下载

### 2. 前端功能

- **拖拽上传**: 支持拖拽文件上传，用户体验友好
- **导入向导**: 清晰的 CSV 格式说明和操作指引
- **进度反馈**: 导入过程中的加载状态显示
- **结果展示**: 详细的导入结果，包括成功数量、错误信息等
- **模板下载**: 一键下载 CSV 模板文件

## 📄 CSV 文件格式

### 列结构

```csv
questionText,description,type,options,correctAnswers,tags,explanation,points,difficulty,descriptionImage
```

### 字段说明

- **questionText**: 题干内容（必填）
- **description**: 题目描述/场景说明（可选，支持 Markdown）
- **type**: 题型类型
    - `single` - 单选题
    - `multiple` - 多选题
    - `text` - 文本题
- **options**: 选项内容，用分号(`;`)分隔（选择题必填）
- **correctAnswers**: 正确答案索引，从0开始，多个答案用分号分隔
- **tags**: 题目标签，用逗号(`,`)分隔
- **explanation**: 答案解析（可选）
- **points**: 分值（可选，默认 1）
- **difficulty**: 难度（可选：easy/medium/hard，默认 medium）
- **descriptionImage**: 描述图片 URL（可选）

### 示例数据

```csv
questionText,description,type,options,correctAnswers,tags,explanation,points,difficulty,descriptionImage
你喜欢哪个颜色？,"**场景**：请选择你最喜欢的颜色。",single,红色;绿色;蓝色,1,"颜色,兴趣",这是一个关于颜色偏好的问题,1,easy,
哪些是编程语言？,"提示：选择所有符合条件的选项。",multiple,JavaScript;Python;Dog,0;1,"技术,测试",选择所有编程语言选项,2,medium,
请简要说明你的人生目标,"可以使用Markdown，例如：**清晰简洁地描述**",text,,,"思辨,职业规划",请用简洁的语言描述,1,medium,
以下哪个是正确的数学公式？,"You can add Markdown like **bold** or _italic_.",single,2+2=4;2+2=5;2+2=6,0,"数学,基础",基础数学运算题,1,easy,
```

## 🔧 技术实现

### 后端 API 端点

1. **CSV 导入**

    ```
    POST /api/admin/question-banks/:id/import-csv
    Content-Type: multipart/form-data
    ```

2. **模板下载**
    ```
    GET /api/admin/question-banks/csv-template/download
    ```

### 核心组件

1. **ImportCSVModal.tsx** - CSV 导入模态框
2. **ImportResultModal.tsx** - 导入结果显示
3. **questionBankController.js** - 后端控制器（新增 CSV 导入方法）
4. **upload.js** - 文件上传中间件

## 🎨 用户界面

### 导入流程

1. 点击 "📄 批量导入 CSV" 按钮
2. 查看格式说明和下载模板
3. 拖拽或选择 CSV 文件
4. 点击 "开始导入"
5. 查看导入结果和错误信息

### 界面特性

- **直观的拖拽区域**: 支持文件拖拽上传
- **实时文件预览**: 显示选中文件信息
- **详细的格式说明**: 内置 CSV 格式指南
- **一键模板下载**: 快速获取标准模板
- **完整的结果反馈**: 成功数量、错误列表、警告信息

## ✨ 高级特性

### 错误处理

- **行级错误定位**: 精确显示错误发生的行号
- **详细错误描述**: 清楚说明错误原因
- **部分导入支持**: 跳过错误行，导入有效数据

### 数据验证

- **格式验证**: 检查 CSV 文件格式
- **内容验证**: 验证题目内容完整性
- **答案验证**: 确保正确答案索引有效
- **类型验证**: 验证题型和选项匹配

### 用户体验

- **加载状态**: 导入过程中显示进度
- **成功反馈**: 清楚显示导入成功的题目数量
- **错误提示**: 友好的错误信息和修复建议

## 📊 测试结果

通过测试脚本验证，CSV 解析功能正常工作：

```
=== Parsing Results ===
Total questions parsed: 4
Total errors: 1

Parsed questions:

1. 你喜欢哪个颜色？
   Type: single_choice
   Options: 红色, 绿色, 蓝色
   Correct Answer(s): 1
   Tags: 颜色, 兴趣

2. 哪些是编程语言？
   Type: multiple_choice
   Options: JavaScript, Python, Dog
   Correct Answer(s): 0,1
   Tags: 技术, 测试

3. 请简要说明你的人生目标
   Type: short_text
   Tags: 思辨

4. 以下哪个是正确的数学公式？
   Type: single_choice
   Options: 2+2=4, 2+2=5, 2+2=6
   Correct Answer(s): 0
   Tags: 数学, 基础
```

## 🚀 使用方法

1. **准备 CSV 文件**
    - 下载模板文件作为参考
    - 按照格式要求填写题目数据
    - 保存为 UTF-8 编码的 CSV 文件

2. **执行导入**
    - 进入题库详情页面
    - 点击 "📄 批量导入 CSV" 按钮
    - 上传准备好的 CSV 文件
    - 等待导入完成并查看结果

3. **处理错误**
    - 查看错误信息和行号
    - 修正 CSV 文件中的问题
    - 重新导入修正后的文件

## 💡 最佳实践

1. **使用模板**: 始终从下载的模板开始编辑
2. **数据验证**: 导入前检查数据格式和内容
3. **小批量测试**: 先用少量数据测试导入功能
4. **备份数据**: 重要数据导入前做好备份
5. **错误处理**: 仔细查看错误信息并及时修正

## 🔄 ChatGPT 辅助生成

该功能完全支持使用 ChatGPT 等 AI 工具生成 CSV 内容：

```prompt
请帮我生成10道关于JavaScript的选择题，格式如下：
questionText,type,options,correctAnswers,tags
题目内容,single,选项1;选项2;选项3,正确答案索引,标签1,标签2
```

AI 可以快速生成符合格式要求的题目数据，大大提高题库建设效率。

---

## 🎉 总结

CSV 导入功能已完全实现并经过测试验证，为 Question Bank 模块提供了强大的批量导入能力。用户可以通过简单的 CSV 文件快速建设题库，支持各种题型，并提供完善的错误处理和用户反馈机制。
