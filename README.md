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
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-PolyForm--Noncommercial--1.0.0-orange" alt="license"></a>
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

> [!WARNING]
> **个人自用 · 禁止商用。**
> 本项目按 [PolyForm Noncommercial 1.0.0](LICENSE) 授权：你可以自己用、读、改、分享给自己的朋友，但**不得用于任何商业用途**——包括但不限于公司内部生产流程、付费产品或服务、以本项目为组成部分对外交付的项目。个人研究、学习、折腾、评测都在允许范围内。

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

## 🚧 项目状态：能用，但远没做完

> 一句话：**主链路已经跑通并可日常使用，周边还是毛坯。** 下面按"已经能用的效果 / 还没做的部分"分开写，免得被 README 骗。

### 现在实测能到什么程度

| 能做到 | 实测/依据 |
|:--|:--|
| 输入框右侧出现胶囊按钮，点一下挂/撤 | 重启后可复现；`● 排版 开/关` 三态正确（含红点异常态） |
| 开关 1 秒内热生效 | `fs.watchFile` 800 ms 轮询，改 `state.json` 或 `/room on` 都行 |
| 装完即有正文，不需要额外配 | 包内 `assets/prompt.default.txt`（7407 字符）首次加载自动铺到 `~/.dsh/composing-room/` |
| 段落真的进请求、改变回答边界 | 挂上后回答出现固定首行 `## <主题> — Technical Reference` 与页脚；不挂则没有 |
| 四种安装方式都能装成 | SFX 双击 / `install.ps1` / `pnpm add tgz` / 手搓 junction，均在假 profile 上验过 |
| 单元测试 4/4 绿 | `test\stub.mjs`、`client.mjs`、`route.mjs`、`firstrun.mjs` |

### 还没做 / 待升级

- [ ] **跨平台**：现在**只支持 Windows**。`install.ps1`（`mklink /J`）、`install.cmd`、IExpress 打包、`room.ps1` 全是 Windows 专属；macOS 与 Linux 的 profile 路径、软链方式、打包链一概没做。
- [ ] **多 profile**：默认只认 `profiles\desktop`，其他 profile 得手传 `-Profile <name>`，不会自动探测。
- [ ] **多套正文**：一次只能挂一份 `prompt.txt`，做不了「写作模式 / 技术模式」一键切换（想加就得改 `state.json` 的 `textPath` 或敲 `/room path`）。
- [ ] **按钮可定制**：文案写死「排版」，只有绿/灰/红三态，不能改名、不能换色、不能变成图标。
- [ ] **i18n**：README 与提示全是中文，英文版没做。
- [ ] **CI**：没有 GitHub Actions，四个测试只在本地手动跑；PR 来了靠人肉看。
- [ ] **代码签名**：`setup.exe` 未签名，Windows 会弹 SmartScreen「已保护你的电脑」，只能点"更多信息 → 仍要运行"。
- [ ] **DSH 版本兼容层**：完全依赖当前扩展点（`systemPrompt.section` / `commands` / `webServer` / client slots），DSH 一升级就可能整条失效，没有版本探测、没有降级路径。
- [ ] **测试覆盖**：路由 401/404 的失败分支、client 轮询失败路径、`/room path` 换文件都没进自动化测试。

## 🆚 和别的方案比

同类需求（"想让模型按某种固定规范回答，并且随时能撤"）常见四类做法，本项目只是其中一种。下表按**能力**比，不按人气比——人气候选那几项都是几万星的成熟项目。

| | 本项目 composing-room | 提示词模板库<br>`awesome-chatgpt-prompts` / `fabric` | 客户端内建预设<br>OpenWebUI / LibreChat / SillyTavern | 仓库级规则文件<br>`AGENTS.md` / `.cursorrules` |
|:--|:--|:--|:--|:--|
| 生效位置 | 独立 system 段落，`order 12000`，**在所有内置段之后** | 你手动粘进对话框（= 用户消息） | 客户端自己的 system 字段 | 由 harness 决定，通常排在运营指令之前 |
| 能不能一键撤 | 能（按钮 / `/room off` / 改 json，1 秒生效） | 靠新开对话 | 要进设置改，多数不支持热切换 | 不能，删文件才生效 |
| 要不要重启 | 不要 | 不要 | 多数要重开对话 | 部分要重启工具 |
| 换一套文本 | 换文件或 `/room path`，正文与代码解耦 | 本来就只有文本 | 存多套预设（本项目做不到） | 增删文件（本项目做不到多套） |
| 绑不绑客户端 | 绑 DSH（唯一支持的宿主） | 不绑，通用 | 强绑自家客户端 | 绑各自工具 |
| 联网 / 依赖 | 零依赖、零网络、纯本地 | 无 | 通常需要 docker 或 node 服务 | 无 |
| 装完即用 | 是（正文随包分发，四条安装路线） | 是（复制粘贴） | 要部署整套服务 | 是（放文件） |

### 优点（相对上述方案，真有的）

1. **位置是可控的，不是"塞进用户消息里"**。段落注册为 `deployment:composing-room`，`order 12000` 排在 harness identity（−1000）与 persona（0 / 10200）之后——这是"提示词技巧"和"模板库"从根本上做不到的一件事，它们只能借用户消息的位置。
2. **开关是运行时的**。按钮、`/room` 命令、外部改 `state.json` 三条路都通，`fs.watchFile` 800 ms 轮询，切换不需要重启、不需要重开会话。
3. **双半架构，纯本地**。浏览器半边只调 `127.0.0.1` 上的一个 exact 路由，宿主半边只碰两个本地文件；不 import `cordis` / `schemastery`，不联网，不采集。
4. **装完即用，四条安装路线**。最省的是一条 192 KB 的自解压 exe：目标机器不需要 git、node、pnpm，也不用先把仓库传过去。
5. **可以测**。stub ctx 覆盖 `effect / systemPrompt.section / commands.register`，不起真 DSH 就能验证"段落、命令、路由三方是否同步"，改一行跑一次。
6. **正文与代码解耦**。`prompt.txt` 是纯文本，换模式就是换文件；不像把提示词硬编码进代码的项目，改一句话要重新打包。
7. **文档写了边界**。README 里明说没做完的九项、许可限制、踩过的坑（`inject` 语义那节），不吹"生产可用"。

### 缺点（相对上述方案，真的差的）

1. **只支持 Windows**。`mklink /J`、IExpress、`.cmd`、`room.ps1` 全是 Windows 专属；macOS / Linux 用户现在装了也用不了。
2. **深绑 DSH 扩展点**。`systemPrompt.section` / `commands` / `webServer` / client slots 任一变，插件就可能整体失效，且没有版本探测与降级路径。
3. **功能面窄**。只做"挂一段 system 文本"：没有模板变量、没有 A/B、没有历史版本、没有使用统计、不能存多套预设一键切换。
4. **单机自用级**。没有多会话隔离、没有多人共用、没有审计日志——这些是 OpenWebUI / LibreChat 那类服务端方案的基本盘，本项目完全不做。
5. **生态为零**。`fabric` 那种项目有几百个 pattern 和社区贡献流程；本项目只有一份内置正文，也没有 pattern 市场。
6. **工程成熟度低**。无 CI、无集成测试（4 个 stub 单测不覆盖真宿主）、exe 未签名（SmartScreen 会拦）、没有 CHANGELOG 之外的发布流程。
7. **许可限制采用面**。PolyForm Noncommercial 挡住一切商用，公司内部想用也用不了——这是有意为之的取舍，但客观上会让它很难被"用起来"。

### 什么情况下该用它 / 不该用它

| 你的情况 | 建议 |
|:--|:--|
| 你在 Windows 上用 DSH，想给某些会话临时加一段固定写作/技术规范，且要能随时撤 | **用它**，这正是它唯一擅长的场景 |
| 你想要一个通用的提示词库、几百个 pattern | 用 `fabric` 或 `awesome-chatgpt-prompts` |
| 你要多人共用、多会话隔离、带审计 | 用 OpenWebUI / LibreChat 这类服务端方案 |
| 你在 Cursor / Claude Code 里想改项目级规则 | 用 `AGENTS.md` / `.cursorrules`，不需要这个插件 |
| 你要把它嵌进商业产品 | 不在许可范围内，需另行联系作者 |

## 🤝 欢迎共建

这个项目**欢迎任何人 fork、改、提 PR**——它本来就是一个人的折腾，做完整要靠更多人。尤其是上面那几条（macOS 移植、多 profile 探测、CI、i18n），谁先动手谁就是作者。

### 怎么提

| 想做什么 | 怎么做 |
|:--|:--|
| 报 bug | 开 issue，标题前缀 `[bug]`，附 **DSH 版本 + profile 名 + `/room` 输出 + 按钮颜色**（红点=路由没接上，灰点=段落没挂） |
| 要功能 | issue 标题前缀 `[feat]`，写清"想解决什么"而不是"想加什么代码" |
| 交代码 | fork → 分支 → PR。改 `lib/` 前后各跑一次测试；改 `build/` 后跑一次打包 |

### 本地开发

```powershell
cd "D:\deepseek harness\dsh-composing-room"
node test\stub.mjs        # 4 个测试，逐个 exit 0 才算过
node test\client.mjs
node test\route.mjs
node test\firstrun.mjs
node build\build-sfx.mjs  # 只在改了 lib/ 或 assets/ 后需要，产出 dist\*.exe
```

约定：

- 代码注释、变量名、提交信息用**英文**；中文只出现在 `README.md` / `DISCLAIMER.md` / 用户可见的按钮文案里（PS 5.1 无 BOM 读 GBK，`.ps1` 里写中文会解析炸）
- 提交信息：`feat:` / `fix:` / `docs:` / `chore:`
- `.cmd`、`.ps1` 必须 CRLF（`.gitattributes` 已经强制）
- 别在 `apply()` 里裸写 `ctx.webServer`——看 [疑难排查](#-疑难排查) 那一节

### 关于商用（再强调一次）

提交代码即表示你同意以 [PolyForm Noncommercial 1.0.0](LICENSE) 发布你的贡献。**本项目不接受"把它做成商业产品"方向的贡献或合作**：不做 SaaS 托管版、不做付费分发、不接企业定制。如果你想在自己的公司里用，那属于商用，请先联系作者谈授权。

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
4. **禁止商用**：按 [PolyForm Noncommercial 1.0.0](LICENSE) 授权，仅限个人研究、学习、评测与非商业组织使用；任何商业用途（公司内部生产、付费产品与服务、对外交付项目）都需另行取得书面授权。
5. 按上述许可以「**AS IS**」提供，不附带任何明示或默示担保；因使用产生的直接、间接、附带、后果性损失，作者与贡献者不承担责任。
6. 插件不读取、不存储、不传输 API Key、Cookie 与会话内容；落盘只有 `prompt.txt` 与 `state.json`。

<details>
<summary><h4>📄 License</h4></summary>

<br>

[PolyForm Noncommercial 1.0.0](LICENSE) © thinkmith

可以：个人自用、学习、研究、修改、分享（附许可）。
不可以：商用、SaaS 托管、付费分发、企业内生产使用（需另行授权）。

</details>
