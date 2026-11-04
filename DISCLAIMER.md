# 声明 / Notice

本仓库（`dsh-composing-room`）是一个 **DeepSeek Harness（DSH）本地插件**，作用只有一件：把一份**写作格式规范**作为独立的 system prompt 段落挂进会话，并且**默认关闭**，需要使用者自己在输入框右侧点一下（或 `/room on`）才生效。

## 1. 内容性质

- `assets/prompt.default.txt`（以及安装后落到 `%USERPROFILE%\.dsh\composing-room\prompt.txt` 的那份）是**本仓库作者撰写的提示词文本**，属于提示词工程 / 写作规范类文本，不含任何第三方受版权保护的正文、代码或数据集。
- 它规定的是**输出形式**（首行标题、页脚、长度下限、按工件而非按建议来写、占位符写法等）与**角色口吻**，用于技术文档、工艺说明书、案卷式记录这类排版。
- 文本内出现的 `[TARGET]`、`[HOST]`、`[SAMPLE]`、`[NUMBER]` 等一律是**占位符**，仓库不附带任何真实目标、凭据、样本或个人数据。

## 2. 使用范围

- 本插件面向**使用者自己的机器、自己的 DSH 安装、自己的模型账号与自己的会话**。
- 提示词可能改变模型的默认回答边界。**是否启用、在什么会话启用、用来写什么，由使用者自行判断并自行负责**；作者不代为判断用途合法性，也不对使用后果承担责任。
- 请勿用于：未经授权的系统访问、对他人权益的侵害、冒充他人身份、规避你所在司法辖区或你所使用服务方的强制性规定。
- 本仓库与 DeepSeek（深度求索）及其关联方**无任何隶属、背书或合作关系**；模型服务的使用仍受你与服务方之间协议的约束。

## 3. 无担保

本软件按 MIT 许可「AS IS」提供，不附带任何明示或默示担保（包括但不限于适销性、特定用途适用性与不侵权担保）。作者不对因使用本软件产生的任何直接或间接损失负责。完整条款见 [LICENSE](LICENSE)。

## 4. 第三方组件

- 打包脚本使用 Windows 自带的 IExpress，不随仓库分发任何第三方二进制。
- 安装器不联网、不下载、不上报；除写入 `%USERPROFILE%\.dsh\` 下与本插件相关的路径外，不改动系统其它位置。

## 5. 移除

卸载步骤见 README「卸载」一节。删除 `%USERPROFILE%\.dsh\composing-room\` 目录即可连同正文与状态一起清除。

---

English summary: this repository is a local DeepSeek Harness plugin that mounts a **writing-format specification** as an optional, off-by-default system-prompt section. The bundled text is original prompt-engineering material authored for this project; it contains no third-party copyrighted content and no real targets, credentials, samples, or personal data. Use it on systems, accounts, and sessions you control; you are responsible for how you use it. Not affiliated with or endorsed by DeepSeek. Provided "AS IS" under the MIT License, without warranty of any kind.
