---

name: sync-upstream
description: 同步本 fork（olinll/Firefly，维护者顾拾柒）与上游 CuteLeaf/Firefly 的更新。保留正确的 Git merge 历史，并按文件改动归属自动决定采用上游版本、保留本地版本或智能合并。当用户提到同步上游、拉取/合并 upstream 更新、sync fork、更新到上游新版本、跟上游保持一致、上游有新提交了等场景时使用。
---

# 同步上游更新（CuteLeaf/Firefly → olinll/Firefly）

本文档是 `olinll/Firefly` 同步上游 `CuteLeaf/Firefly` 的操作规范。

仓库关系：

* fork：`olinll/Firefly`
* `origin`：`olinll/Firefly`
* `upstream`：`CuteLeaf/Firefly`
* 默认同步分支：`master`
* 维护者：olinll
* Git `user.name` 通常为：`顾拾柒`

同步目标不是简单让 fork 与上游文件完全一致，而是：

> **吸收 upstream 的最新代码，同时保留 fork 有意维护的定制行为，并在 Git 历史中真实记录 upstream 已被合并。**

核心原则：

1. **仅上游修改** → 采用上游版本
2. **仅 fork 修改** → 保留 fork 当前版本
3. **双方都修改** → 以上游最新版为结构基础，重新应用 fork 的修改意图
4. **删除、重命名、重构等特殊情况** → 根据双方修改意图判断，不能只按路径机械处理
5. **双方分叉时形成真实的 merge commit**，让 `upstream/master` 成为同步提交的父历史之一；如果当前分支可以直接快进，则允许使用 fast-forward

---

# 一、绝对禁止事项

同步过程中不得：

```bash
git reset --hard
git clean -fd
git push
git push --force
git rebase upstream/master
```

除非用户明确要求，否则：

* 不自动 push
* 不自动删除备份分支
* 不丢弃用户未提交修改
* 不自动 stash 用户修改后继续同步
* 不强制重写 fork 历史
* 不因为解决冲突方便而直接覆盖整仓库

如果发现工作区存在用户未提交修改，应停止同步并报告。

---

# 二、同步前检查

## 1. 确认当前工作区干净

先执行：

```bash
git status --porcelain
```

如果有任何输出，停止同步。

不要自动执行：

```bash
git stash
git reset --hard
git clean
```

应告诉用户当前存在未提交内容，需要先处理。

---

## 2. 确认当前分支

执行：

```bash
git branch --show-current
```

默认只允许在：

```text
master
```

执行 upstream 同步。

如果当前不是 `master`，停止同步并报告当前分支。

不要把 feature 分支上的开发修改误认为 fork 的长期定制。

---

## 3. 检查 remote

执行：

```bash
git remote -v
```

应确认：

```text
origin   -> olinll/Firefly
upstream -> CuteLeaf/Firefly
```

URL 可以是 HTTPS 或 SSH，只要对应仓库正确即可。

例如：

```text
https://github.com/olinll/Firefly.git
git@github.com:olinll/Firefly.git
```

都可以作为正确的 `origin`。

如果 `upstream` 不存在，可以添加：

```bash
git remote add upstream https://github.com/CuteLeaf/Firefly.git
```

如果已经存在 `upstream`，但它指向的不是：

```text
CuteLeaf/Firefly
```

则停止并报告，不要静默修改已有 remote。

同理，如果 `origin` 不是：

```text
olinll/Firefly
```

也应停止并报告。

---

# 三、获取 upstream 并记录同步目标

执行：

```bash
git fetch upstream --prune
```

记录当前 upstream SHA：

```bash
UPSTREAM_SHA=$(git rev-parse upstream/master)
UPSTREAM_SHORT=$(git rev-parse --short upstream/master)

echo "upstream: $UPSTREAM_SHA"
```

然后确定共同基线：

```bash
BASE=$(git merge-base HEAD upstream/master)

echo "merge-base: $BASE"
```

这个 `BASE` 是本次分析双方改动的共同起点。

---

# 四、先判断是否真的需要合并

## 情况 A：已经包含最新 upstream

执行：

```bash
git merge-base --is-ancestor upstream/master HEAD
```

如果返回成功，说明当前 fork 已经包含 `upstream/master`。

无需再次同步。

报告：

```text
当前 master 已包含 upstream/master 最新提交，无需同步。
```

然后结束。

---

## 情况 B：fork 没有独有提交，可以直接快进

在执行快进前，先按照“第五节”创建安全备份分支。

执行：

```bash
git merge-base --is-ancestor HEAD upstream/master
```

如果成功，说明当前 `HEAD` 是 upstream 的祖先，没有需要保留的 fork 分叉提交。

直接快进：

```bash
git merge --ff-only upstream/master
```

然后进入“验证”阶段。

这种情况不需要人工智能合并，也不会产生 merge commit；但 upstream 提交会进入当前分支的 ancestry。

---

## 情况 C：双方已经分叉

如果：

```text
HEAD 不是 upstream/master 的祖先
upstream/master 也不是 HEAD 的祖先
```

说明双方都有独立修改。

进入下面的智能同步流程。

---

# 五、同步前创建安全备份

在情况 B 或情况 C 即将执行实际更新之前，创建当前 `HEAD` 的备份分支：

```bash
BACKUP_BRANCH="backup/pre-upstream-sync-$(date +%Y%m%d-%H%M%S)"

git branch "$BACKUP_BRANCH" HEAD

echo "backup: $BACKUP_BRANCH"
```

不得自动删除该备份分支。

最终汇报时需要告诉用户备份分支名称。

---

# 六、分析双方相对于共同基线的净改动

判断“谁改过文件”时，应使用最终净 diff，而不是简单统计提交历史中曾出现过哪些文件。

## upstream 净改动

```bash
git diff --name-status --find-renames "$BASE" upstream/master
```

## fork 净改动

```bash
git diff --name-status --find-renames "$BASE" HEAD
```

注意：

```text
git log --name-only
```

不能作为判断文件当前是否被修改的唯一依据。

例如某个文件被 fork 修改后又恢复成原样，它虽然出现在提交历史里，但最终：

```bash
git diff "$BASE" HEAD
```

没有变化，因此不应该被认为是 fork 当前定制。

---

# 七、状态类型不能只看 A/M/D

`git diff --name-status` 可能出现：

```text
A    Added
M    Modified
D    Deleted
R    Renamed
C    Copied
T    Type changed
```

同步分析必须至少正确处理：

* A
* M
* D
* R

尤其遇到：

```text
R
```

不能简单使用“文件路径集合求交”。

例如 upstream：

```text
R100 src/old.ts src/new.ts
```

而 fork：

```text
M src/old.ts
```

实际上属于双方涉及同一逻辑文件，需要智能迁移 fork 修改。

---

# 八、查看 fork 独有修改意图

文件归属由 `git diff` 判断。

提交历史主要用于理解：

> fork 为什么这样改。

查看 fork 相对于共同基线的提交：

```bash
git log --no-merges "$BASE"..HEAD --format="%h %an %s"
```

针对某个文件：

```bash
git log --no-merges -p "$BASE"..HEAD -- <path>
```

必要时也查看 upstream 对应修改：

```bash
git log --no-merges -p "$BASE"..upstream/master -- <path>
```

不要单纯根据作者名字判断修改是否应该保留。

作者可能包括：

* olinll
* 顾拾柒
* dependabot
* GitHub bot
* 其他协作者

判断重点是：

> 这项修改是否属于 fork 需要长期维持的行为。

---

# 九、建立真实 Git merge 状态

完成分析后执行：

```bash
git merge --no-commit --no-ff upstream/master
```

此命令非常重要。

它的目的不仅是合并代码，更是让最后的同步提交拥有两个父历史：

```text
当前 fork HEAD
upstream/master
```

从而让未来：

```bash
git merge-base HEAD upstream/master
```

能正确识别本次已经同步过的 upstream 历史。

如果 Git 报告冲突：

```text
CONFLICT
Automatic merge failed
```

这不代表同步流程失败。

这是双方分叉时的正常情况。

确认仍处于 merge 状态：

```bash
git rev-parse -q --verify MERGE_HEAD
```

如果存在 `MERGE_HEAD`，继续按照下面的规则解决。

如果 merge 命令失败且不存在 `MERGE_HEAD`，则停止并报告真实错误。

---

# 十、按改动归属处理文件

## A. 仅 upstream 修改

如果文件相对于 `BASE`：

```text
upstream 修改
fork 未修改
```

则最终结果应采用 upstream。

正常情况下 Git merge 已自动完成，无需再次修改。

必要时可明确恢复 upstream 版本：

```bash
git restore --source=upstream/master --staged --worktree -- <path>
```

如果 upstream 删除了该文件，而 fork 未修改：

```bash
git rm -- <path>
```

---

# 十一、仅 fork 修改

如果：

```text
upstream 未修改
fork 修改
```

则保持 fork 当前行为。

通常 Git merge 会自动保留。

如果需要恢复 merge 前 fork 版本，可执行：

```bash
git restore --source=HEAD --staged --worktree -- <path>
```

注意：

在 merge 提交完成前，`HEAD` 仍指向 merge 前的 fork 提交，因此这里代表 fork 原版本。

典型文件可能包括：

```text
src/content/
src/config/ 中明确个性化的配置
public/ 中个人静态资源
fork 自有文档
```

但不能仅根据目录名机械判断，仍需要检查实际 Git diff。

---

# 十二、双方都修改的文件

这是整个同步流程的重点。

对文件先理解 fork 修改：

```bash
git log --no-merges -p "$BASE"..HEAD -- <path>
```

必要时查看 upstream：

```bash
git log --no-merges -p "$BASE"..upstream/master -- <path>
```

然后采用以下原则：

> **以上游当前实现作为结构基础，把 fork 的“行为意图”重新实现到 upstream 最新代码结构中。**

不要机械复制旧代码块。

如果 upstream 已经：

* 重构函数
* 重命名组件
* 移动目录
* 修改数据结构
* 更换 API
* 重写样式系统
* 删除旧实现

则应该将 fork 的定制“翻译”到 upstream 的新结构中。

---

## 推荐处理方式

对于普通双方修改文件，可以先恢复 upstream 版本：

```bash
git restore --source=upstream/master --staged --worktree -- <path>
```

然后根据：

```bash
git log -p "$BASE"..HEAD -- <path>
```

重新实现 fork 需要保留的功能。

完成后：

```bash
git add <path>
```

---

# 十三、冲突决策优先级

处理双方修改时按以下顺序判断：

1. upstream 是否已经实现了 fork 原本解决的问题
2. fork 修改是否仍然有存在必要
3. upstream 是否改变了相关架构
4. fork 修改能否直接迁移到新架构
5. 是否会引入重复功能
6. 是否会重新启用 fork 有意删除或禁用的行为
7. 是否会破坏当前用户站点已有配置或内容

如果 upstream 已经用更好的方式实现 fork 原来的修复：

> 不必机械保留 fork 的旧实现。

应保留：

> fork 想达到的效果。

而不是：

> fork 当时具体写出的每一行代码。

---

# 十四、特殊冲突：upstream 删除、fork 修改

例如：

```text
upstream: D src/foo.ts
fork:     M src/foo.ts
```

不能简单选择本地或 upstream。

首先调查 upstream 为什么删除：

```bash
git log --diff-filter=D --summary "$BASE"..upstream/master -- src/foo.ts
```

并搜索功能是否被迁移到新位置。

如果 upstream 将功能：

```text
src/foo.ts
```

重构到：

```text
src/features/foo/index.ts
```

则：

> 删除旧文件，同时把 fork 对 `foo.ts` 的定制意图迁移到新的 upstream 实现中。

如果 upstream 完全删除该功能：

* 如果 fork 明确需要继续保留 → 可以保留或重新实现
* 如果 fork 修改已经没有意义 → 跟随 upstream 删除
* 无法判断 → 列为用户决策项

---

# 十五、特殊冲突：fork 删除、upstream 修改

例如：

```text
upstream: M src/foo.ts
fork:     D src/foo.ts
```

通常代表 fork 曾经有意：

* 禁用某功能
* 删除不需要的组件
* 移除上游默认行为

不能因为 upstream 更新了这个文件，就自动把该功能重新加入 fork。

应先查看 fork 删除该文件的提交意图。

如果确认属于有意删除：

> 默认继续保持删除。

如果 upstream 新版本把该文件改造成其他重要功能，则重新评估。

无法确定时列入用户决策项。

---

# 十六、Rename 冲突

遇到：

```text
R
```

或类似：

```text
rename/modify
rename/delete
```

时不能只根据路径判断。

应确认：

1. upstream 新路径是什么
2. fork 修改对应旧文件的哪些功能
3. fork 修改是否应该迁移到 upstream 新文件
4. 旧路径是否还应该存在

最终优先遵循 upstream 的新目录结构，把 fork 定制迁移到新路径。

不要为了保留 fork patch 而恢复 upstream 已淘汰的旧目录结构。

---

# 十七、package.json 与 pnpm-lock.yaml

这两个文件视为一个整体：

```text
package.json
pnpm-lock.yaml
```

不能独立随意处理。

如果只有 upstream 修改依赖：

> 采用 upstream 的依赖状态。

如果 fork 自己添加过依赖，而 upstream 也修改了依赖：

1. 以上游 `package.json` 为基础
2. 检查 fork 独有依赖是否仍被代码使用
3. 补回仍然需要的 fork 依赖
4. 解决版本兼容问题
5. 重新运行：

```bash
pnpm install
```

6. 让 pnpm 重新生成正确的：

```text
pnpm-lock.yaml
```

不要人工逐行拼接 lockfile。

应使用仓库 `package.json` 中：

```text
packageManager
```

指定的 pnpm 版本。

如果本机 pnpm 版本不匹配，优先通过 Corepack 使用项目声明的版本。

---

# 十八、生成文件

对于由脚本或构建过程生成的文件，不建议人工逐行解决冲突。

例如可能包括：

```text
src/constants/lqips.json
src/constants/github-card-data.json
dist/
Pagefind 数据
字体子集
图片派生数据
GitHub card 数据
其他 scripts/ 生成结果
```

原则：

> 优先合并生成文件的源数据、配置和生成脚本，然后重新运行 generator 或构建流程。

不要优先手工修改生成结果。

如果可以通过：

```bash
pnpm build
```

重新生成，则应以重新生成为准。

---

# 十九、src/content

`src/content/` 通常包含 fork 的个人文章、动态或内容数据。

原则：

* fork 自有内容默认保留
* upstream 新增的模板、示例或 schema 变更需要分析
* 不因为同步 upstream 而删除 fork 个人文章
* 如果 upstream 修改 content schema，应迁移 fork 内容以符合新 schema

所以不能简单地把整个：

```text
src/content/
```

永久排除在 upstream 更新之外。

---

# 二十、个人配置与静态资源

以下内容通常倾向于保留 fork 定制：

```text
src/config/
public/
个人头像
背景图
站点信息
导航配置
个人链接
个人内容
```

但如果 upstream 对对应配置结构进行了重构：

> 应迁移 fork 配置值到 upstream 新结构。

不能为了保留旧配置文件而阻止 upstream 的架构升级。

---

# 二十一、README / AGENTS.md / docs

fork 自有说明文档中的本地说明应保留。

例如：

```text
README.md
AGENTS.md
docs/
```

如果这些文件双方都修改：

* fork 自有部署说明、维护说明、个性化信息优先保留
* upstream 新增的重要安装、升级、Breaking Change、安全说明需要人工整合
* 不应无条件整文件选择一侧

---

# 二十二、二进制文件

如果双方都修改：

* 图片
* 字体
* 压缩文件
* 其他不可文本合并的二进制文件

不能进行所谓“智能逐行合并”。

应根据文件用途选择：

* 个人资源 → 通常保留 fork
* upstream 项目资源 → 通常使用 upstream
* 双方都具有必要修改 → 保留两份或调整引用方式

无法确定时列入用户决策项。

---

# 二十三、检查所有 Git 冲突是否已经解决

执行：

```bash
git status
```

不能存在：

```text
Unmerged paths
both modified
both added
deleted by us
deleted by them
```

也可执行：

```bash
git diff --name-only --diff-filter=U
```

如果存在输出：

> 说明还有未解决冲突，不得提交。

---

# 二十四、验证依赖

如果本次修改涉及：

```text
package.json
pnpm-lock.yaml
```

则运行：

```bash
pnpm install
```

如果没有依赖变化，不需要为了同步无条件修改 lockfile。

---

# 二十五、代码验证

依次执行：

```bash
pnpm check
pnpm type-check
pnpm build
```

当前 Firefly 仓库提供这些命令，因此同步后必须尽量全部执行。

任一步失败时：

1. 不立即提交
2. 阅读完整错误
3. 优先检查双方都修改的文件
4. 检查 upstream 是否改变了 API、类型或配置结构
5. 修复同步导致的问题
6. 再次执行验证

不要为了让验证通过而：

* 删除 fork 功能
* 使用 `any` 大范围掩盖类型错误
* 注释掉失败代码
* 禁用构建检查
* 删除测试或检查脚本

除非这些修改本身是正确迁移的一部分。

---

# 二十六、检查构建产生的额外文件

执行验证后再次：

```bash
git status --short
```

检查是否出现：

* 新生成文件
* lockfile 意外变化
* 缓存
* 构建产物
* 临时文件

只有明确属于本次同步结果的内容才能提交。

不要把：

```text
缓存
日志
临时文件
本地环境文件
```

误提交进仓库。

---

# 二十七、最终 diff 审查

提交前至少检查：

```bash
git diff --stat HEAD
```

以及：

```bash
git diff HEAD
```

由于当前处于 merge 状态，重点确认最终工作树符合：

> upstream 最新代码 + fork 必须保留的定制

而不是：

> 尽可能减少 diff。

同步质量优先于 diff 大小。

---

# 二十八、提交

获取 upstream 短 SHA：

```bash
UPSTREAM_SHORT=$(git rev-parse --short upstream/master)
```

提交信息使用 Conventional Commits：

```text
chore: 同步上游 CuteLeaf/Firefly（<UPSTREAM_SHORT>）
```

例如：

```bash
git commit -m "chore: 同步上游 CuteLeaf/Firefly（$UPSTREAM_SHORT）"
```

这个提交必须是在：

```text
MERGE_HEAD
```

仍然存在的 merge 状态下完成。

不要在提交前执行：

```bash
git merge --abort
```

也不要先结束 merge 再创建普通单父提交。

---

# 二十九、确认 merge ancestry 正确

提交完成后验证：

```bash
git merge-base --is-ancestor upstream/master HEAD
```

必须成功。

这代表：

> 当前 fork Git 历史已经真实包含本次同步的 upstream/master。

还可查看：

```bash
git log --graph --oneline --decorate -20
```

同步提交正常情况下应体现 fork 与 upstream 两条历史汇合。

---

# 三十、最终汇报

同步完成后向用户报告：

## 上游信息

```text
同步到 upstream/master：
<完整 SHA 或短 SHA>
```

## 同步结果

至少包括：

* 仅 upstream 修改并采用的文件数量
* 仅 fork 修改并保留的文件数量
* 双方修改并智能合并的文件数量
* 删除/重命名特殊处理数量
* dependency / lockfile 是否变化
* 是否产生新的生成文件

## 智能合并文件

逐项说明：

```text
<path>
- upstream 做了什么
- fork 原来的定制是什么
- 最终如何处理
```

不需要逐行解释代码，但必须说明关键决策。

## 验证结果

报告：

```text
pnpm check      ✅ / ❌
pnpm type-check ✅ / ❌
pnpm build      ✅ / ❌
```

## 备份

报告：

```text
备份分支：
backup/pre-upstream-sync-...
```

## 用户决策项

如果有无法明确判断的内容，单独列出：

```text
需要用户确认：
1. ...
2. ...
```

不要偷偷选择高风险方案。

---

# 三十一、不要主动 push

同步、测试、commit 完成以后停止。

不要执行：

```bash
git push
```

向用户汇报：

```text
本地同步和提交已经完成，尚未 push。
```

由用户检查后自行决定是否推送。

---

# 核心思想

整个同步流程需要同时满足两个目标。

## Git 负责历史关系

通过：

```bash
git merge --no-commit --no-ff upstream/master
```

保证 upstream 的提交真正进入 fork ancestry。

## AI 负责最终代码树

通过分析：

```bash
BASE -> upstream/master
BASE -> HEAD
```

判断每个文件属于：

```text
仅 upstream 修改
仅 fork 修改
双方修改
rename/delete 等特殊情况
```

最终生成：

> **upstream 最新架构 + fork 有价值的定制行为**

而不是单纯选择：

```text
ours
```

或：

```text
theirs
```

也不是机械把旧 patch 粘回新代码。

长期维护 fork 时，应该保留的是：

> **定制的意图和行为**

而不是：

> **旧版本的具体代码形态。**
