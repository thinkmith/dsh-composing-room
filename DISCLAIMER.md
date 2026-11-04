_本文不是法律意见，只是一份把话说清楚的说明。使用本插件前请完整读一遍，读完再装。_

---

## 零、许可与商用禁止（先看这条）

本项目按 **[PolyForm Noncommercial 1.0.0](LICENSE)** 授权，**不是** MIT，也**不是**可以随意商用的开源许可。

| 可以做 | 不可以做 |
|---|---|
| 个人自用、学习、研究、评测、折腾 | 任何商业用途 |
| 读代码、改代码、给朋友分享（附许可全文） | 公司内部生产流程里用 |
| 在教学、公益、公共研究机构里用 | 打包进付费产品、SaaS 托管、对外交付项目 |
| 提 issue、提 PR 一起改 | 拿它当商业服务的一部分卖给客户 |

一句话：**自己的机器上随便用，别人的钱一分不能赚。** 要商用请先联系作者取得书面授权。

---

## 一、这个仓库里是什么

| 组成 | 是什么 | 不是什么 |
|---|---|---|
| `lib/index.js` | DSH 宿主半边：注册一个 system prompt 段落、一个 `/room` 命令、一个本地 HTTP 路由 | 不联网、不采集、不上报 |
| `lib/client.js` | DSH 浏览器半边：输入框右侧那颗胶囊按钮 | 不读文件、不碰凭据，只调本机 `127.0.0.1` 的路由 |
| `assets/prompt.default.txt` | 默认正文（一段写作规范文本，7407 字符） | 不是可执行代码，不会被"运行" |
| `install.ps1` / `install.cmd` / `*.exe` / `*.tgz` | 四种安装方式，做同一件事：写文件 + 改 profile 配置 + 铺默认正文 | 不安装服务、不写注册表、不设开机自启 |

一句话：它只在你自己的机器、你自己的 DSH 里，往**你自己的会话**加一段文本。

---

## 二、改变的是什么，后果归谁

1. 插件挂上后，`prompt.txt` 的正文会作为**独立 system 段落**进入该会话的每一轮请求，位置在所有内置段之后。这会改变模型回答的默认边界与表达风格——这是它的功能，也是它的风险。
2. 装、开、写正文、拿它去做什么，全部由使用者决定并承担后果。作者不参与、不知情、不授权任何具体用途。
3. 使用即表示你确认：你在自己的账号、自己的机器、自己有权操作的会话上使用；你所在司法辖区的法律与所接入模型服务方的条款，由你自己核对与遵守。

---

## 三、担保

本项目按 **PolyForm Noncommercial 1.0.0**（见 [LICENSE](LICENSE)）以「**AS IS**」提供，不附带任何明示或默示担保，包括但不限于适销性、特定用途适用性、不侵权。因使用或无法使用本项目产生的任何直接、间接、附带、后果性损失，作者与贡献者不承担责任。

---

## 四、第三方与隶属关系

- 本项目是**独立的第三方本地插件**，与 DeepSeek（深度求索）及其任何关联主体**无隶属、无背书、无合作关系**；文中出现的产品名仅用于说明运行环境。
- 运行时依赖 DSH 自身的公开扩展点（`systemPrompt` / `commands` / `webServer` / client slots）。DSH 版本升级可能让这些扩展点变化，届时本插件可能失效——这属于兼容性问题，不属于安全问题。
- 仓库内不含任何第三方模型权重、SDK 或闭源组件。`assets/prompt.default.txt` 由本项目自行撰写。

---

## 五、凭据与数据

- 插件**不读取、不存储、不传输**任何 API Key、Cookie、会话内容。它写盘的东西只有两样，都在 `%USERPROFILE%\.dsh\composing-room\`：`prompt.txt`（正文）与 `state.json`（开关状态）。
- 浏览器半边调用的路由是本机 `127.0.0.1` 上的 `/api/composing-room`，只做"读状态 / 翻转开关"两件事。
- 安装脚本会修改 `%USERPROFILE%\.dsh\profiles\<profile>\cordis.patch.yml`（追加三行 insert）。改动前后请自行备份；脚本本身幂等，重复运行不会叠加。

---

## 六、使用范围

本项目面向**在你自有环境中做提示词工程、写作规范固化与红队自测**的用途。以下情形不在作者意图之内，也不被作者授权：把它部署到你无权操作的账号或机器上；用它规避你已同意的服务条款；用它生成或分发违法内容。若你所在地区对相关技术有额外限制，请自行判断是否可以使用。

---

## 七、移除

```powershell
# 1) 撤段落
powershell -NoProfile -ExecutionPolicy Bypass -File room.ps1 off
# 2) 删掉 cordis.patch.yml 里 composing-room 那三行
# 3) 删掉软链/目录（删 junction 不会删到本体）
cmd /c rmdir "%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-composing-room"
# 4) 删掉正文与状态
cmd /c rmdir /s /q "%USERPROFILE%\.dsh\composing-room"
```

移除后重启 DSH，插件即不再加载。

---

## English summary

`composing-room` is a local, third-party plugin for DeepSeek Harness. It appends **one system-prompt section** (a writing-style specification) to your own session, after all built-in sections, and exposes a toggle button in the composer plus a `/room` command. It is **off by default**.

It is licensed under the **PolyForm Noncommercial License 1.0.0** — **personal and noncommercial use only; commercial use of any kind is not permitted** — and is provided **AS IS**, without warranty of any kind. You are solely responsible for how you use it, for the content you put into `prompt.txt`, and for compliance with the laws of your jurisdiction and the terms of any model service you connect to. There is **no affiliation with, endorsement by, or partnership with DeepSeek**. The plugin does not read, store, or transmit API keys, cookies, or conversation content; it writes only `prompt.txt` and `state.json` under `%USERPROFILE%\.dsh\composing-room\`, and it modifies `cordis.patch.yml` in your DSH profile during installation.

Commercial licensing enquiries, questions, or removal requests: open an issue at <https://github.com/thinkmith/dsh-composing-room/issues>.
