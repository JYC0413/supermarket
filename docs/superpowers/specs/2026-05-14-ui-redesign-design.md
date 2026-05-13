# UI 视觉重设计 — 设计文档

**日期**：2026-05-14
**目标**：将游戏 UI 从 demo 水平提升到星露谷物语同等精美程度
**策略**：分三阶段推进，每阶段完成即可见效果，不需要一次性全部完成

---

## 1. 设计方向

### 视觉风格
- **参考**：星露谷物语（Stardew Valley）— 暖色、恬静、有书卷气
- **配色**：暖米/奶油背景、深棕木质边框、金色高亮、暖绿确认色
- **字体**：Noto Serif SC（思源宋体，Google Fonts）— 衬线字体，替换现有 Courier New
- **面板风格**：C 型木框 — 厚棕色外框 + 奶油内区 + 四角铆钉 + 像素高光/阴影不对称边框

### 核心色板（UITheme 设计 token）

| Token | 值 | 用途 |
|---|---|---|
| `bgWarm` | `#fdf6e8` | 页面/面板底色 |
| `woodDark` | `#7a4018` | 木框外层、粗边框 |
| `woodMid` | `#c07830` | 柜台台面、装饰线 |
| `woodLight` | `#f0d8a0` | 按钮基础色（渐变上） |
| `woodShadow` | `#7a4818` | 按钮右/下边（阴影侧） |
| `woodHighlight` | `#f8eecc` | 按钮左/上边（高光侧） |
| `parchment` | `#fffcf0` → `#fdf4d8` | 内容区渐变 |
| `inkDark` | `#3a2010` | 主文字色 |
| `inkMid` | `#7a5a30` | 次要文字、非关键词 |
| `inkLight` | `#b09060` | 灰色词块、禁用状态 |
| `gold` | `#ffd060` | HUD 金色文字 |
| `goldBorder` | `#d4900a` | 关键词圈选边框 |
| `keywordBg` | `#fff3a0` | 关键词已选背景 |
| `green` | `#70b030` | 确认键、答对色 |
| `greenLight` | `#b0e070` | 确认键高光 |
| `red` | `#cc4040` | 答错/删除键色 |
| `hudBg` | `#3d1f00` → `#2a1200` | HUD 顶栏背景渐变 |
| `nail` | `#4a2800` | 四角铆钉色 |

### 字体
```ts
fontFamily: '"Noto Serif SC", serif'
```
在 `index.html` 预加载：
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">
```

---

## 2. 第一阶段：地基（预计 1 个会话）

**目标**：换完即可见 60-70% 视觉改善，零结构改动。

### 2.1 新建 `src/ui/UITheme.ts`

集中管理所有设计 token，包含：
- 全部颜色常量（取代 `config.ts` 里散落的 hex 值）
- `FONT` 常量（思源宋体）
- 尺寸常量：`PANEL_PAD = 10`、`NAIL_SIZE = 7`、`BORDER_THICK = 4`
- 工具函数 `drawWoodFrame(g: Phaser.GameObjects.Graphics, x, y, w, h)`：
  - 外层：填充 `woodDark`，宽 4px
  - 内层：填充 `parchment`
  - 顶/左内边框：1px `#e8d090`（高光）
  - 右/下内边框：1px `#c8a060`（阴影）
  - 四角铆钉：7×7px 圆角矩形，颜色 `nail`

### 2.2 更新 `index.html`

添加 Google Fonts preconnect + stylesheet link。

### 2.3 批量替换各文件颜色/字体引用

| 文件 | 改动 |
|---|---|
| `config.ts` | 保留 `DEFAULT_SETTINGS`，删除 `COLORS`/`FONT*` 常量（迁入 UITheme） |
| `HUDScene.ts` | 引用 UITheme 颜色和字体 |
| `DialogueBox.ts` | 引用 UITheme 颜色和字体 |
| `NumPad.ts` | 引用 UITheme 颜色和字体 |
| `PatienceBar.ts` | 引用 UITheme 颜色和字体 |
| `StepIndicator.ts` | 引用 UITheme 颜色和字体 |

**验收标准**：游戏跑起来，背景变暖，文字变宋体，无控制台报错。

---

## 3. 第二阶段：组件 C 型木框改造（预计 2-3 个会话）

每个组件独立改造，改完即可测试。顺序按视觉影响从高到低。

### 3.1 DialogueBox

**结构变化**：
- 外层：`drawWoodFrame` 生成木框容器
- 内区：奶油渐变背景
- 四角铆钉：4 个 Graphics 圆角矩形
- 「💬 顾客说：」小标题标签
- 关键词 chunk 样式：
  - 未选：浅木色底 + 细单色边框
  - 已选：黄色渐变底 + 不对称高光/阴影边框 + `box-shadow` 1px offset（通过多层 Graphics 实现）
- 超难题 badge：`⚡ 超难题！` — 深棕底 + 橙色边框

### 3.2 NumPad

**结构变化**：
- 外层：`drawWoodFrame`
- 显示面板：深棕凹陷感（深色填充 + 内阴影方向反向）
  - 上半：prompt 文字（小字，`inkMid` 色）
  - 分隔线
  - 下半：输入值（大字，`#ffe0a0`）
- 数字键：每个键三层
  1. 阴影层（右下偏移 2px，`#3a1800`）
  2. 键体（木色渐变）
  3. 不对称边框（左/上高光，右/下阴影）
- 按压动画：`pointerdown` 触发 tween `y += 2`，`pointerup` 复原，duration 60ms
- 确认键：绿色渐变，`gridColumn: span 3`

### 3.3 HUD

**结构变化**：
- 背景：深棕渐变 `#3d1f00` → `#2a1200`，底边 3px `#6b3a1a`
- 计时器：凹陷显示框（`#5a2800` 底 + 金色边框）
- 班级金币：金色粗体
- 顾客进度：`inkLight` 色
- 最高记录：暖绿色

### 3.4 PatienceBar

**结构变化**：
- 容器：奶油底 + 底边 2px 分隔线
- 进度轨道：凹陷感（左/上深色边，右/下浅色边）
- 进度填充：渐变色
  - >50%：`#78cc50` → `#50a030`（绿）
  - 25-50%：`#f0c030` → `#c09010`（黄）
  - <25%：`#e05050` → `#b02020`（红）

### 3.5 StepIndicator

**结构变化**：
- 容器：奶油底 + 底边 2px
- 三个 tab 等宽排列
- 已完成：`inkMid` 色 + ✓ 后缀
- 当前激活：金色渐变底 + 顶边高亮 + 轻微上移（视觉凸起）
- 未到达：`inkLight` 色

---

## 4. 第三阶段：动效（预计 1 个会话）

全部用 Phaser `tween` 实现，无需外部资源（除金币用现有 `emote_cash.png`）。

### 4.1 关键词圈选
- 触发：`pointerup` 且验证通过
- 效果：chunk 弹跳 — `scale 1 → 1.35 → 0.92 → 1`，duration 380ms，ease `Back.easeOut`
- 同时：浮动文字 `+¥8` — `y -= 54`，`alpha 1 → 0`，duration 1100ms

### 4.2 金币飞出（答对后）
- 素材：`emotes` spritesheet（`pixel_style1.png`）中的 cash 帧；帧号需实现时从 spritesheet 目视确认（`emote_cash.png` 单图可作参考）
- 效果：3 枚金币从顾客区域飞向 HUD 班级总额位置
- 实现：每枚 tween `{x, y}` → HUD 坐标，stagger delay 100ms，完成后 `destroy()`

### 4.3 连胜火焰
- 3 连胜：1 个火焰 sprite（用 `emote_star` 或纯 Graphics 绘制）+ flicker tween（`scaleY 1 ↔ 1.1`，循环）
- 5 连胜：3 个火焰，尺寸更大，tween 频率更快
- 放置位置：StepIndicator 右侧

### 4.4 答错反馈
- 已有：摄像机抖动（保留）
- 新增：耐心条闪红 — `fill.setFillStyle(0xcc2020)`，持续 200ms 后复原，重复 2 次

### 4.5 答对结算徽章
- 效果：绿色圆角矩形从 `scale 0.5` 弹出到 `scale 1`，ease `Back.easeOut`，停留 900ms 后 `alpha → 0`
- 内容：`✓  +¥30`（金额动态填入）

---

## 5. 不在本次范围内

- 商店背景场景（`buildStoreScene`）：当前程序化 Graphics 已经够用，暂不触动
- 音效：留待后续讨论
- 开始/结束界面：留待后续讨论
- 顾客角色多样性：留待后续讨论
