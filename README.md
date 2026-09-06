<div align="center">

# 流萤 / Firefly(二次开发版)

</div>

> [!IMPORTANT]
> 本仓库是 [顾拾柒 (olinll)](https://github.com/olinll) 基于上游 [**CuteLeaf/Firefly**](https://github.com/CuteLeaf/Firefly) 的**二次开发版本**，在保留可同步上游更新能力的前提下做个性化定制。
>
> - **上游项目**：https://github.com/CuteLeaf/Firefly （功能特性、在线演示、完整文档均见上游）
> - **上游使用文档**：https://docs-firefly.cuteleaf.cn/
> - **当前版本**：`v6.16.7`（跟随上游）

![Upstream](https://img.shields.io/badge/上游-CuteLeaf%2FFirefly-orange)
![Version](https://img.shields.io/badge/版本-6.16.7-blue)
![Node.js](https://img.shields.io/badge/node.js-%3E%3D22-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 项目简介

Firefly 是一款基于 Astro 的清新美观、高度可定制的静态博客主题。本 fork 由顾拾柒维护，主要用于个人博客的二次开发，不用于替代上游项目。

## 同步上游更新

本仓库已配置 `upstream` 远程指向上游仓库，同步策略与操作步骤见 **[docs/sync-upstream.md](./docs/sync-upstream.md)**：

- 仅上游改过的文件 → 采用上游版本
- 仅本仓库（olinll）改过的文件 → 保留当前版本
- 双方都改过的文件 → 分析 olinll 的提交意图，与上游改动合并优化

手动同步方式：

```bash
git fetch upstream --prune
```

获取更新后，请按照 [同步操作规范](./docs/sync-upstream.md) 完成备份、改动分析、合并和验证，不要直接执行普通的 `git merge upstream/master`。

## 快速开始

环境要求：Node.js ≥ 22、pnpm ≥ 11。

```bash
pnpm install
pnpm dev       # 开发服务器，http://localhost:4321
pnpm build     # 构建到 ./dist
pnpm preview   # 本地预览构建结果
pnpm new-post <filename>   # 创建新文章
```

博客配置位于 `src/config/` 目录，详细配置说明见[上游使用文档](https://docs-firefly.cuteleaf.cn/)。

## 致谢与许可

- 上游项目 [CuteLeaf/Firefly](https://github.com/CuteLeaf/Firefly)（MIT），基于 [saicaca/fuwari](https://github.com/saicaca/fuwari) 二次开发，感谢原作者的贡献
- 本项目遵循 [MIT](./LICENSE) 协议开源
