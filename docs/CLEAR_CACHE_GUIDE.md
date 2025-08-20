# 清除缓存指南

## 1. 浏览器强制刷新（推荐先试这个）

### Chrome / Edge / Firefox:
- **Windows**: `Ctrl + F5` 或 `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### Safari:
- **Mac**: `Cmd + Option + R`

## 2. 使用无痕/隐私模式测试
- **Chrome**: `Ctrl + Shift + N` (Windows) 或 `Cmd + Shift + N` (Mac)
- **Firefox**: `Ctrl + Shift + P` (Windows) 或 `Cmd + Shift + P` (Mac)
- **Safari**: `Cmd + Shift + N` (Mac)

## 3. 清除特定网站缓存

### Chrome:
1. 按 `F12` 打开开发者工具
2. 右键点击刷新按钮
3. 选择 "清空缓存并硬性重新加载"

### Firefox:
1. 按 `F12` 打开开发者工具
2. 点击 Network 标签
3. 右键选择 "Clear Cache"

## 4. 完全清除浏览器缓存

### Chrome:
1. 按 `Ctrl + Shift + Delete` (Windows) 或 `Cmd + Shift + Delete` (Mac)
2. 选择时间范围："全部时间"
3. 勾选：
   - 浏览记录
   - Cookie 和其他网站数据
   - 缓存的图片和文件
4. 点击"清除数据"

### Firefox:
1. 按 `Ctrl + Shift + Delete` (Windows) 或 `Cmd + Shift + Delete` (Mac)
2. 选择时间范围："全部"
3. 勾选：
   - 缓存
   - Cookie
   - 网站数据
4. 点击"立即清除"

### Safari:
1. 菜单 > Safari > 清除历史记录...
2. 选择"所有历史记录"
3. 点击"清除历史记录"

## 5. 清除 DNS 缓存（如果域名解析有问题）

### Windows:
```cmd
ipconfig /flushdns
```

### Mac:
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### Linux:
```bash
sudo systemctl restart systemd-resolved
# 或
sudo service network-manager restart
```

## 6. 重启浏览器
完全关闭浏览器（包括后台进程），然后重新打开

## 7. 测试步骤
1. 清除缓存后访问: https://uat-sigma.jiangren.com.au/super-admin/
2. 检查浏览器开发者工具的 Console 标签是否有错误
3. 检查 Network 标签查看资源加载情况
