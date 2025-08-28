# Rollup Native Module Jenkins 修复方案

## 🐛 问题描述
Jenkins构建失败，错误信息：
```
Error: Cannot find module @rollup/rollup-linux-x64-gnu
```

## 🔍 根本原因
1. **可选依赖问题**: Rollup的原生模块是作为可选依赖安装的
2. **平台特定模块**: `@rollup/rollup-linux-x64-gnu` 是Linux x64平台的原生模块
3. **NPM bug**: 相关的NPM bug (#4828) 导致可选依赖安装不完整

## ✅ 修复方案

### 1. 环境变量配置
在Jenkinsfile中添加NPM配置：
```groovy
environment {
    npm_config_optional = 'true'
    npm_config_legacy_peer_deps = 'true'
}
```

### 2. 显式安装原生模块
在依赖安装阶段：
```bash
# 基础安装
npm install --legacy-peer-deps

# 显式安装Rollup原生模块
npm install @rollup/rollup-linux-x64-gnu --legacy-peer-deps
```

### 3. 构建前验证
在构建阶段添加检查：
```bash
if npm list @rollup/rollup-linux-x64-gnu > /dev/null 2>&1; then
    echo "✅ Rollup native module found"
else
    echo "⚠️  Installing missing rollup native module..."
    npm install @rollup/rollup-linux-x64-gnu --legacy-peer-deps
fi
```

## 🔧 完整修复实施

### 修改的文件
- `Jenkinsfile_main_frontend`:
  - 添加NPM环境变量配置
  - 显式安装Rollup原生模块
  - 构建前模块存在性检查

### 修复逻辑
1. **环境准备**: 设置NPM配置确保可选依赖被正确处理
2. **依赖安装**: 先进行标准安装，然后显式安装缺失的原生模块
3. **构建验证**: 构建前检查关键模块是否存在
4. **失败恢复**: 如果检查失败，尝试重新安装

## 🎯 预期效果

✅ 解决Rollup原生模块缺失问题
✅ 确保Vite构建工具正常工作
✅ 提高Jenkins环境的构建稳定性
✅ 为未来类似问题提供参考方案

## 🧪 验证步骤

1. **本地模拟**: 在Linux环境下测试相同的安装命令
2. **Jenkins测试**: 触发构建任务验证修复效果
3. **日志检查**: 确认模块安装和检查日志正常
4. **构建成功**: 验证dist目录生成和内容正确

## 📚 相关资源

- [NPM Optional Dependencies Bug #4828](https://github.com/npm/cli/issues/4828)
- [Rollup Native Modules Documentation](https://rollupjs.org/guide/en/#installing)
- [Vite Build Configuration](https://vitejs.dev/config/build-options.html)

---

**修复时间**: $(date)
**修复类型**: 原生模块依赖问题
**影响范围**: Jenkins构建环境
