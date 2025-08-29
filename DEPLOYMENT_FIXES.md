# UAT部署修复说明

## 问题描述

在UAT部署过程中，`super-admin`的`index.html`文件会被自动删除，导致Super Admin界面无法访问。

## 根本原因

问题出现在Jenkins UAT部署流程中的S3同步命令：

```bash
aws s3 sync dist/ s3://${CLIENT_S3_BUCKET}/super-admin/ --delete
```

`--delete`参数会删除目标S3路径中所有不存在于源目录(`dist/`)中的文件。如果构建过程有任何问题，或者`dist/`目录中缺少某些文件，这些文件就会从S3中被删除。

## 修复方案

### 1. 改进的构建验证

- 在Super Admin构建阶段添加了详细的文件验证
- 确保`index.html`和`assets`目录在构建后存在
- 添加构建内容预览，便于调试

### 2. 安全的部署策略

- **移除了危险的`--delete`参数**（对于Super Admin部署）
- 在部署前创建自动备份
- 客户端部署使用`--exclude "super-admin/*"`避免误删Super Admin文件
- 添加部署后验证检查

### 3. 新增健康检查阶段

- 部署完成后自动验证所有关键文件
- 检查客户端和Super Admin的`index.html`
- 验证资源文件完整性
- 测试后端API连通性

## 主要修改

### Jenkinsfile_uat 修改摘要

1. **构建阶段改进**：
   - 添加构建前清理
   - 详细的文件验证
   - 构建内容预览

2. **部署阶段改进**：
   - 自动备份现有部署
   - 移除Super Admin的`--delete`参数
   - 客户端部署排除Super Admin目录
   - 添加部署验证

3. **新增健康检查阶段**：
   - 全面的部署后验证
   - 连通性测试
   - 详细的状态报告

## 使用的工具脚本

### 1. 部署验证脚本 (`verify-deployment.sh`)

用于手动验证部署状态：

```bash
./verify-deployment.sh
```

功能：
- 检查客户端和Super Admin的`index.html`
- 验证资源文件完整性
- 列出备份文件
- 测试URL连通性

### 2. 回滚脚本 (`rollback-deployment.sh`)

用于紧急回滚到之前的版本：

```bash
./rollback-deployment.sh 20231201-143022
```

功能：
- 快速回滚到指定备份
- 自动创建紧急备份
- 验证回滚结果

## 部署流程改进

### 之前的问题流程
```
构建 → 直接同步到S3(--delete) → 可能删除关键文件
```

### 现在的安全流程
```
构建 → 验证构建文件 → 创建备份 → 安全同步 → 部署验证 → 健康检查
```

## 预防措施

1. **构建验证**：确保所有关键文件在构建后存在
2. **自动备份**：每次部署前自动创建备份
3. **分离部署**：客户端和Super Admin部署互不影响
4. **部署验证**：部署后立即验证文件完整性
5. **健康检查**：全面的部署后检查
6. **回滚机制**：快速回滚到之前版本的能力

## 监控建议

1. 定期运行`verify-deployment.sh`检查部署状态
2. 监控备份文件数量，定期清理旧备份
3. 设置告警，当关键文件丢失时立即通知
4. 记录每次部署的时间戳和状态

## 故障排除

### 如果Super Admin仍然无法访问：

1. 运行验证脚本：
   ```bash
   ./verify-deployment.sh
   ```

2. 检查最近的备份：
   ```bash
   aws s3 ls s3://uat.sigmaq.co/ | grep super-admin-backup
   ```

3. 如需回滚：
   ```bash
   ./rollback-deployment.sh [backup-timestamp]
   ```

4. 重新部署：
   - 触发Jenkins UAT管道
   - 检查构建日志中的验证步骤
   - 确认健康检查通过

## 文件备份

- 原始Jenkinsfile已备份为`Jenkinsfile_uat.backup`
- 可以随时对比查看修改内容：
  ```bash
  diff -u Jenkinsfile_uat.backup Jenkinsfile_uat
  ```

## 总结

这些修改解决了Super Admin在UAT部署时文件被删除的问题，同时提供了：

- ✅ 更安全的部署流程
- ✅ 自动备份和回滚能力
- ✅ 详细的验证和健康检查
- ✅ 便于调试的日志输出
- ✅ 分离的客户端和管理员部署

通过这些改进，UAT部署将更加稳定和可靠。