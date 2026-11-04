<p align="center">
  <img src="assets/logo.svg" width="96" height="96" alt="composing room">
</p>

<h1 align="center">composing-room</h1>

<p align="center"><em>把一段文本挂成会话里的独立 system 段落 —— 默认关，点一下才开</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.3.0-3B82F6" alt="version">
  <img src="https://img.shields.io/badge/DSH-0.2.1--rc.2-8B5CF6" alt="dsh">
  <img src="https://img.shields.io/badge/platform-Windows-0078D4" alt="platform">
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen" alt="dependencies">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license"></a>
</p>

<p align="center">
  <a href="#-安装">安装</a> ·
  <a href="#-使用">使用</a> ·
  <a href="#-开关">开关</a> ·
  <a href="#-架构">架构</a> ·
  <a href="#-疑难排查">疑难排查</a> ·
  <a href="#-免责声明">免责声明</a>
</p>

> [!NOTE]
> 这是 DSH（DeepSeek Harness）的本地插件，**不是**网页应用、不是代理、不联网。
> 装完之后输入框右侧就多一颗 `● 排版 关` 胶囊按钮；点一下变绿，该会话的每一轮请求都会带上 `prompt.txt` 里那段正文。

## ✨ 它做什么

| | 能力 | 说明 |
|:--:|---|---|
| 🎛 | **一键开关** | 输入框右侧胶囊按钮（`conversation.input.right` 槽位），点一下挂/撤，3 秒轮询同步 |
| 📄 | **独立段落** | 注册名 `deployment:composing-room`，`order 12000`，落在所有内置段之后（harness identity −1000 / persona 0~10200） |
| ♻️ | **热生效** | 改 `state.json` 或 `prompt.txt` 后约 1 秒内挂上/撤下，不用重启 |
| 📦 | **装完即用** | 包内自带 7407 字符默认正文，首次加载自动铺到 `~/.dsh/composing-room/prompt.txt` |
| 🧩 | **零依赖** | 不 import `cordis` / `schemastery`，profile 的 `node_modules` 里本来也没有它们 |
| 🛡 | **默认关闭** | `armed: false`。开关状态只存在本地文件里，不上报任何地方 |

它**不**注册工具（`defineTool` 需要 agent/turn 权限校验，没必要），也**不**读你的 API Key、Cookie 或会话内容。

## 🚀 安装

四条路线做的是同一件事：写文件 → 往 profile 的 `cordis.patch.yml` 插三行 → 铺 `~/.dsh/composing-room/`。挑一条，**装完重启一次 DSH**。

| 路线 | 适合 | 需要 |
|:--|---|---|
| **A · SFX 双击** | 给完全不想碰终端的机器 | 无 |
| **B · `install.ps1`** | 本机已有仓库文件夹 | PowerShell |
| **C · `pnpm add`** | 已经在用 pnpm 管 profile | node + pnpm |
| **D · 手搓** | 想看清到底改了什么 | 编辑器 |

### A · 双击安装包（最省事）

去 [**Releases → latest**](https://github.com/thinkmith/dsh-composing-room/releases/latest) 下 `dsh-composing-room-<ver>-setup.exe`（约 192 KB），双击，重启 DSH。

<details>
<summary><b>它内部怎么做的 / 会看到什么提示</b></summary>

<br>

- 载荷由 Windows 自带的 IExpress 打包，里面只有两个平铺文件：`install.cmd` + `setup.ps1`
- `setup.ps1` 把 `lib/index.js`、`lib/client.js`、`assets/prompt.default.txt`、`package.json` 以 base64 内嵌，运行时直接写进 profile 的 `node_modules\dsh-composing-room\`
- **不建 junction**：IExpress 会解到 `%TEMP%\IXP*`，指向那里的软链在临时目录被删后就断了，所以 SFX 走实文件拷贝
- 系统提示属正常：SmartScreen「已保护你的电脑」→ 更多信息 → 仍要运行；从网上下载的 exe 可能带 MOTW 标记

</details>

### B · 跑脚本

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\deepseek harness\dsh-composing-room\install.ps1"
```

干三件事，**全部幂等**（重复跑只会打印 already）：

1. `mklink /J` 把包链接进 `%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-composing-room`（加 `-Mode copy` 改成复制）
2. 往 `cordis.patch.yml` 追加注释块 + `- insert: [- id: composing-room, name: 'dsh-composing-room']`（已有就跳过）
3. 铺 `~\.dsh\composing-room\`：`prompt.txt`（7407 字符）+ `state.json`（`armed:false`）

### C · tgz

```powershell
cd "$env:USERPROFILE\.dsh\profiles\desktop"
pnpm add "D:\deepseek harness\dsh-composing-room\dist\dsh-composing-room-0.3.0.tgz"
powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1 -SkipPatch   # 或自己补 patch
```

### D · 手搓

```powershell
cmd /c mklink /J "%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-composing-room" "D:\deepseek harness\dsh-composing-room"
```

```yaml
# %USERPROFILE%\.dsh\profiles\desktop\cordis.patch.yml 末尾
- insert:
    - id: composing-room
      name: 'dsh-composing-room'
```

手改 patch **不会**触发运行中实例的加载，必须重启一次。

### ✅ 装完自检三步

1. 输入框右侧出现 `● 排版 关`（灰）——没有就说明 client 半边没被扫到，先看 patch 有没有真的插进去
2. 敲 `/room` —— 应该回「状态：已关 / 文本：…（7407 字符）」
3. 点按钮变绿，下一轮回答开始带 `## <主题> — Technical Reference` 与 `— 排版完成` 页脚

## 🖱 使用

按钮占的是 composer 的 `conversation.input.right` 槽位（`id: composing-room`、`order 5`），就是发送按钮左边那一行：

| 状态 | 外观 | 含义 |
|:--|:--|:--|
| 已挂 | `● 排版 开`（绿点 + 微光） | 段落进入本轮及之后的每一轮请求 |
| 已撤 | `● 排版 关`（灰点） | 段落不挂，模型按自己的默认来 |
| 路由异常 | `● 排版 ?`（红点） | 宿主路由没接上，悬停看原因（`HTTP 401` / `HTTP 404` / 网络错误） |

悬停提示里带字符数与 order。浏览器半边**不碰文件系统**，只调宿主半边注册的本机路由：

| 方法 | 路径 | 作用 |
|:--|:--|:--|
| `GET` | `/api/composing-room` | 读状态：`{armed, armedFlag, chars, order, section, textPath}` |
| `POST` | `/api/composing-room?action=toggle` | 翻转（`on` / `off` 也认） |

## 🔌 开关

三条路，效果一样：

**1 · 会话里打命令**

```text
/room on            开
/room off           关
/room reload        看当前状态 + 文本字符数
/room path <file>   换一份正文
```

**2 · 外部脚本**（不用开会话，热生效）

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File room.ps1 on
powershell -NoProfile -ExecutionPolicy Bypass -File room.ps1 off
powershell -NoProfile -ExecutionPolicy Bypass -File room.ps1 status
```

**3 · 直接改状态文件**

```powershell
'{"armed":true,"order":12000}' | Out-File -Encoding utf8 "$env:USERPROFILE\.dsh\composing-room\state.json"
```

插件用 `fs.watchFile`（800 ms）盯着它，改完约 1 秒内挂上/撤下。

## 🏗 架构

```text
dsh-composing-room/
├── lib/
│   ├── index.js          # 宿主半边：systemPrompt 段落 + /room 命令 + HTTP 路由
│   └── client.js         # 浏览器半边：conversation.input.right 胶囊按钮
├── assets/
│   ├── prompt.default.txt# 默认正文（7407 字符）
│   └── logo.svg
├── test/                 # stub ctx 单测：stub.mjs / client.mjs / route.mjs / firstrun.mjs
├── build/
│   ├── build-sfx.mjs     # IExpress 造 setup.exe
│   └── release.mjs       # 建 release + 传附件
├── install.ps1 / install.cmd
└── room.ps1 / room-toggle.ps1
```

| 位置 | 内容 |
|:--|:--|
| `%USERPROFILE%\.dsh\composing-room\prompt.txt` | 正文（换文本就改这个文件） |
| `%USERPROFILE%\.dsh\composing-room\state.json` | `{armed, textPath, order}` |
| `%USERPROFILE%\.dsh\profiles\desktop\cordis.patch.yml` | 三行 insert，决定插件挂不挂 |

## 🩺 疑难排查

<details>
<summary><b>按钮一直灰、点了没反应——真凶是 <code>inject</code> 的写法</b></summary>

<br>

cordis 里 `inject` 是 **服务名 → 拦截配置的映射**（或者名字数组）。写成 `{ required: [...], optional: [...] }` 不是一种声明形式：key 会被当成服务名，fiber 去等两个叫 `required` 和 `optional` 的服务，永远等不到，`apply()` 一次都不跑——段落没有、`/room` 没有、路由没有；而 client 半边照样被服务（Loader entry 存在），于是按钮在、点了没反应。

正确写法：

```js
export const inject = ['systemPrompt', 'commands']            // 必需的两条
ctx.inject(['webServer'], (webCtx) => { /* 可选服务在回调里才拿得到 */ })
```

路由必须走回调：直接在 `apply()` 里写 `if (ctx.webServer) ...` 是不行的——`inject.optional` 声明的服务在 apply 那一刻还没就绪，`ctx.webServer` 是 `undefined`，注册被静默跳过，每次 `fetch` 落到 `dsh-client-connection` 的 fallback 返回 `401 dsh web authentication required...`。

另一个要防的坑：`apply()` 里任何一句抛错都会让 fiber FAILED 并回收已注册的 effect（路由跟着被撤）。所以路由与 `/room` 的注册都包了 try/catch + `ctx.logger.warn`。

</details>

<details>
<summary><b>改了 <code>prompt.txt</code> 没反应</b></summary>

<br>

段落文本在**注册那一刻**定稿：`ctx.systemPrompt.section({text})` 收的是 string。换正文走 `/room reload`、`/room path <file>`，或改完文件后 `/room off` 再 `/room on` 让它重挂。

</details>

<details>
<summary><b>段落挂上了但回答没变化</b></summary>

<br>

先确认三件事：① 按钮是绿的且悬停显示字符数 7407；② 该会话确实是新开的一轮（段落只在每轮请求里拼进去，历史消息不改）；③ 正文本身有没有到模型那边——用 `/room reload` 看字符数，空串段会被 `renderPrompt` 过滤掉。

</details>

## 🧪 自检与卸载

**自检**（stub ctx 覆盖 `effect / systemPrompt.section / commands.register`）：

```powershell
cd "D:\deepseek harness\dsh-composing-room"
node test\stub.mjs
```

```text
after apply (state disarmed) | active: 0 | ever: 0
after /room on               | active: 1 | ever: 1 deployment:composing-room@12000:7407
after /room off              | active: 0
after external state.json arm| active: 1
after lifecycle dispose      | active: 0
```

**卸载**：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File room.ps1 off
# 删掉 cordis.patch.yml 里 composing-room 的注释与 insert
cmd /c rmdir "%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-composing-room"
```

## 📌 已知边界

- 段落文本在注册那一刻定稿，不能原地改对象。
- 只有 `armed` 且正文非空才挂段；空串段会被 `renderPrompt` 过滤。
- 只在本机 DSH 上验证过（Windows + DSH 0.2.1-rc.2）；DSH 升级改了扩展点就可能失效。
- 不注册工具、不采集数据、不联网。

## ⚠️ 免责声明

使用前请完整阅读 [**DISCLAIMER.md**](DISCLAIMER.md)。要点：

1. 本插件挂在**你自己的** DSH、账号与会话上，正文进入每一轮请求、会改变模型回答的默认边界——这是功能，也是风险。
2. 安装、开启、写正文、以及拿它做什么，全部由使用者决定并承担后果；作者不参与、不知情、不授权任何具体用途。
3. 本项目是独立第三方本地插件，**与 DeepSeek（深度求索）及其关联主体无隶属、无背书、无合作**；产品名仅用于说明运行环境。
4. 按 **MIT License** 以「**AS IS**」提供，不附带任何明示或默示担保；因使用产生的直接、间接、附带、后果性损失，作者与贡献者不承担责任。
5. 插件不读取、不存储、不传输 API Key、Cookie 与会话内容；落盘只有 `prompt.txt` 与 `state.json`。

<details>
<summary><h4>📄 License</h4></summary>

<br>

[MIT](LICENSE) © thinkmith

</details>
