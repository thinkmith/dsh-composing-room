# composing-room

DSH 本地插件：把一段文本作为独立的 system prompt 段落挂到会话里，**默认关闭**，要你在输入框右边点一下（或 `/room on`）才挂上。装完之后按钮就在，不需要先敲命令（`config.armed: true` 可反向锁定为默认开）。

> 使用前请读 [DISCLAIMER.md](DISCLAIMER.md)：本插件挂在**你自己的** DSH、账号与会话上，提示词会改变模型的默认回答边界，用途与后果由使用者自负；与 DeepSeek 无隶属关系；MIT「AS IS」无担保。

- 段落名 `deployment:composing-room`，order `12000`（落在所有内置段之后）
- 文本正文放在 `%USERPROFILE%\.dsh\composing-room\prompt.txt`
- 开关状态放在 `%USERPROFILE%\.dsh\composing-room\state.json`
- 插件本体零依赖（不 import cordis / schemastery，profile 的 node_modules 里也没有）

## 会话里的按钮（输入框右侧）

浏览器半边 `lib/client.js` 占了 composer 的 `conversation.input.right` 槽位（id `composing-room`、order 5），就是发送按钮左边的控件行。显示：

- `● 排版 开` —— 绿点，段落已挂
- `● 排版 关` —— 灰点，段落已撤
- `● 排版 ?` —— **红点，宿主路由没接上**，悬停看原因（`HTTP 401` / `HTTP 404` / 网络错误）

点一下翻转，3 秒轮询同步（`/room on|off` 在会话里敲也能让按钮跟着变）。悬停提示里带字符数与 order。

工作原理：浏览器半边不碰文件系统，只调宿主半边注册的一个 HTTP 路由。

| 方法 | 路径 | 作用 |
|---|---|---|
| `GET` | `/api/composing-room` | 读状态：`{armed, armedFlag, chars, order, section, textPath}` |
| `POST` | `/api/composing-room?action=toggle` | 翻转（`on` / `off` 也认） |

### 为什么一开始永远红 / 永远灰（真凶）

`inject` 在 cordis 里是 **服务名 → 拦截配置的映射**（或者名字数组）。写成 `{ required: [...], optional: [...] }` 不是一种声明形式：它的 key 会被当成服务名，于是 fiber 在等两条名叫 `required` 和 `optional` 的服务，永远等不到，`apply()` 一次都不跑 —— 段落没有、`/room` 没有、路由没有；而 client 半边照样被服务（Loader entry 存在），所以按钮在、点了没反应、永远灰，重启后变红。

正确写法：

```js
export const inject = ['systemPrompt', 'commands']   // 必需的两条
ctx.inject(['webServer'], (webCtx) => { /* 可选服务在回调里才拿 */ })
```

另一个必须防的坑：`apply()` 里任何一句抛错都会让 fiber FAILED 并回收已经注册的 effect（路由会跟着被撤掉）。所以路由注册和 `/room` 注册都包了 try/catch + `ctx.logger.warn`。

路由必须走 `ctx.inject(['webServer'], (webCtx) => webCtx.effect(() => webCtx.webServer.register(...)))`。直接在 `apply()` 里写 `if (ctx.webServer) ...` 是不行的：`inject.optional` 里声明的服务在 apply 那一刻还没就绪，`ctx.webServer` 是 `undefined`，注册被静默跳过——按钮照样渲染（client 半边由 Loader entries 扫描服务），但每次 `fetch` 都落到 `dsh-client-connection` 的 fallback，返回 401 `dsh web authentication required...`，于是按钮永远灰、点了没反应（乐观翻转在 `snap === undefined` 时不会生效）。

## 开关

三种都能用，效果一样：

1. **会话里打命令**（重启后可用）
   ```
   /room on          开
   /room off         关
   /room reload      看当前状态 + 文本字符数
   /room path <file> 换一份正文
   ```
2. **外部脚本**（不用开会话，热生效）
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File room.ps1 on
   powershell -NoProfile -ExecutionPolicy Bypass -File room.ps1 off
   powershell -NoProfile -ExecutionPolicy Bypass -File room.ps1 status
   ```
3. **直接改状态文件**
   ```powershell
   '{"armed":true,"order":12000}' | Out-File -Encoding utf8 "$env:USERPROFILE\.dsh\composing-room\state.json"
   ```
   插件用 `fs.watchFile`（800ms）盯着它，改完约 1 秒内挂上/撤下。

## 安装（换一台机器照这个来）

最快的一条：去 [Releases](https://github.com/qitaizhe0903-crypto/dsh-composing-room/releases/latest) 下 `dsh-composing-room-<ver>-setup.exe`，双击，重启 DSH 一次。下面四条路线效果一样，按你手头的条件挑。

一句话：**装完就有输入框右边那个按钮**。按钮是包里的 client 半边（`lib/client.js` + package.json 的 `dsh.client`），宿主半边在第一次加载时会把 `assets/prompt.default.txt` 复制到 `%USERPROFILE%\.dsh\composing-room\prompt.txt`，所以不存在"装了但没内容、点了没反应"的情况。

### 路线 A：直接给这个文件夹（最快）

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\deepseek harness\dsh-composing-room\install.ps1"
```

干三件事，全是幂等的（重复跑只会打印 already）：

1. `mklink /J` 把包链接进 `%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-composing-room`（`-Mode copy` 改成复制）
2. 往 profile 的 `cordis.patch.yml` 追加 `- insert: [- id: composing-room, name: 'dsh-composing-room']`（已有就跳过）
3. 铺好 `~\.dsh\composing-room\`：`prompt.txt`（7407 字符正文）+ `state.json`（`armed:false`）

然后**重启一次 DeepSeek Harness**，输入框右侧就有 `● 排版 关`。

### 路线 B：给一个 tgz

```powershell
cd "$env:USERPROFILE\.dsh\profiles\desktop"
pnpm add "D:\deepseek harness\dsh-composing-room\dist\dsh-composing-room-0.3.0.tgz"
# 再往 cordis.patch.yml 追加那三行 insert（或直接跑 install.ps1 -SkipPatch 跳过 patch 那步）
```

重启一次生效。

### 路线 C：手搓

```powershell
cmd /c mklink /J "%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-composing-room" "D:\deepseek harness\dsh-composing-room"
# cordis.patch.yml 末尾：
#   - insert:
#       - id: composing-room
#         name: 'dsh-composing-room'
```

手改 `cordis.patch.yml` 不触发运行中实例的加载，**必须重启一次**。

### 路线 D：给一个 `setup.exe`（双击，最省事）

```text
dist\dsh-composing-room-0.3.0-setup.exe      # 192 KB，双击即装
```

它做的事和路线 A 一样（写文件 → 打 patch → 铺 `~\.dsh\composing-room\`），区别只是**它把源码装在 exe 里**，所以对方机器上不需要 git、node、pnpm，也不需要先把这个文件夹传过去：

- 载荷是 IExpress（Windows 自带）打的，里面只有两个平铺文件：`install.cmd` + `setup.ps1`
- `setup.ps1` 里 `lib/index.js`、`lib/client.js`、`assets/prompt.default.txt`、`package.json` 全部以 base64 内嵌，运行时直接写进 profile 的 `node_modules\dsh-composing-room\`
- **不建 junction**（IExpress 会解到 `%TEMP%\IXP*`，指向那里的软链在解压目录被删后就断了），所以 SFX 走的是"实文件拷贝"

重新构建：

```powershell
node build\build-sfx.mjs      # 等价于 npm run build:sfx
```

产物：`dist\sfx\setup.ps1`、`dist\sfx\install.cmd`、`dist\sfx\iexpress.sed`、`dist\dsh-composing-room-<ver>-setup.exe`。

对方会遇到的两种系统提示，都属于正常现象：SmartScreen「已保护你的电脑」→ 更多信息 → 仍要运行；如果 exe 是从网上下载的，可能还带 MOTW 标记。

### 装完自检三步

1. 输入框右侧出现 `● 排版 关`（灰）——没有就说明 client 半边没被扫到，去看 profile 的 patch 是否真的插进去了
2. 敲 `/room` ——应该回「状态：已关 / 文本：…（7407 字符）」
3. 点按钮变绿，下一轮回答开始带 `## <主题> — Technical Reference` 和 `— 排版完成` 页脚

## 自检

```powershell
cd "D:\deepseek harness\dsh-composing-room"
node test\stub.mjs
```

stub ctx 覆盖了 `effect / systemPrompt.section / commands.register`，会打印：

```
after apply (state disarmed) | active: 0 | ever: 0
after /room on               | active: 1 | ever: 1 deployment:composing-room@12000:7407
after /room off              | active: 0
after external state.json arm| active: 1
after lifecycle dispose      | active: 0
```

## 卸载

1. `room.ps1 off`（先撤段落）
2. 删掉 `cordis.patch.yml` 里那三行 `composing-room` 的注释与 insert
3. `rmdir "%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-composing-room"`（删 junction，不会删到本体）

## 已知边界

- 段落文本在**注册那一刻**定稿，`ctx.systemPrompt.section({text})` 收的是 string，所以换正文走 `reload` / `path`，不是原地改对象。
- 只有 `armed` 且文本非空才挂段；空串段会被 `renderPrompt` 过滤掉。
- 本插件不注册工具（`defineTool` 需要 agent/turn 权限校验，没必要）。
