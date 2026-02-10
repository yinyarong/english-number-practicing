这是根据网上一个大神创建的英文学习数字听力练习的一个网站而克隆创建的，源网址为 https://microblock.cc/learn/number。

结果有一天发现登不上去了，还好那个时候自己有截图和一些视频记录。

因此利用 OpenAI 就创建了这个仓库，供自己使用的同时希望可以帮助到更多人。

---

## 功能介绍

### 练习模式

| 模式 | 说明 | 示例 |
|------|------|------|
| 数字 | 0-9999 的基础数字 | 123, 4567 |
| 长数字 | 包含 Thousand/Million/Billion 的大数字 | 1,234,567 (one million two hundred thirty-four thousand...) |
| 手机号 (11位) | 中国手机号格式 | 138****1234 |
| 电话号 (8位) | 8位固定电话 | 12345678 |
| 日期 | 年-月-日 格式 | 2025-01-15 |
| 时间 | 小时:分钟 格式 | 09:30 |
| 年份 | 四位数年份 | 1936 (nineteen thirty-six) |

### 交互功能

| 功能 | 操作 |
|------|------|
| 播放音频 | 按空格键 或 点击输入区域 |
| 输入数字 | 点击数字键盘 或 按键盘 0-9 |
| 删除 | 点击 ← 键 或 按 Backspace |
| 提交答案 | 点击 ↵ 键 或 按 Enter |
| 自动提交 | 输入正确位数后自动提交（可在设置中关闭） |

### 其他功能

- **主题切换** - 点击右上角太阳/月亮图标切换深色/浅色模式
- **历史记录** - 点击右上角历史图标查看练习记录（本地存储，最多100条）
- **设置面板** - 点击设置图标切换语言、语音引擎等
- **点击外部关闭** - 点击面板外任意位置自动关闭设置/历史记录

---

## 在线使用

访问 GitHub Pages：https://yinyarong.github.io/english-number-practicing/

---

## 本地运行

1. 克隆仓库
```bash
git clone https://github.com/yinyarong/english-number-practicing.git
```

2. 用浏览器打开 `index.html` 即可使用

---

## 时间播报方式

工具支持三种英语时间播报方式，随机练习：

1. **直接读法** - "three fifteen", "nine oh five"
2. **Past 结构** - "fifteen past three", "half past nine"
3. **To/Till/Before 结构** - "fifteen to four", "quarter to ten"
