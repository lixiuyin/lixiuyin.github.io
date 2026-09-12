# lixiuyin.github.io

**简体中文** | [English](README.en.md)

李袖印的中文个人主页，发布于 <https://lixiuyin.github.io>，主要面向 Agent 开发、Agent 评测与 AI 应用方向的日常实习申请。

根地址 `/` 直接承载中文主页，不进行跳转；`zh.html` 是由 `index.html` 生成的兼容镜像，也直接展示同一页面。两者均以根地址作为 canonical URL，从而兼容历史链接并避免缓存造成的循环跳转。

## 页面内容

当前公开页面依次展示：

- 实习安排与关注方向；
- 面向招聘者的项目经历；
- 技术能力；
- 教育经历与荣誉；
- 邮箱、电话、个人主页及项目仓库等联系入口。

项目经历以 Agent 架构、工具调用、RAG、记忆、可靠性评测和失败分析为主。网页保留比单页简历更丰富的项目信息；研究方法和教学经历可在源码中留档，但不在当前日常实习版本中展示。

## 仓库结构

```text
index.html             # 中文主页与样式，直接发布到根地址
zh.html                # 由 index.html 生成的无跳转兼容镜像
main.js                # 导航、滚动定位、主题切换和折叠交互
assets/                # 网站图片、图标、校徽与经审核的发布资源
  CV.tex / CV.pdf      # 英文简历源文件与成品
  CV_zh.tex            # 通用中文简历的共享源文件
  cv/                  # 按岗位归档的中文简历源文件与成品
  transcripts/         # 私有成绩单（本地使用，不发布）
scripts/               # 首页同步、内容一致性和 STAR 表述检查
materials/             # 私有展示稿、项目交付物与历史归档
notes/                 # 私有求职调研数据、报告和生成脚本
tmp/                   # 可随时清理的临时产物
Makefile               # 检查、预览、构建与受控发布命令
robots.txt
sitemap.xml
.nojekyll
README.md              # 默认中文仓库说明
README.en.md           # 英文仓库说明
```

`materials/`、`notes/`、`tmp/`、定向简历和成绩单均为本地工作内容，通常受 `.gitignore` 保护；公开发布只采用 `Makefile` 中的明确白名单，不应把整个仓库或 `assets/` 目录直接上传给第三方托管服务。各子目录的用途和维护入口分别记录在其 `README.md` 中。

## 修改入口

- 主页内容与样式：`index.html`
- 历史中文地址兼容：修改 `index.html` 后运行 `make sync-homepage`，不要单独编辑 `zh.html`
- 页面交互：`main.js`
- 内容与一致性规则：`scripts/check-content.mjs` 及相应测试
- 通用中文简历：`assets/CV_zh.tex`
- 英文简历：`assets/CV.tex`

## 本地预览与检查

```bash
make serve
make stop
make check

# 或手动启动静态服务
python3 -m http.server 8000
```

`make serve` 默认在 `http://localhost:8000` 预览，并复用本项目已运行的服务；如端口被其他进程占用，可使用 `make serve PORT=8001`。

检查流程覆盖：首页与 `zh.html` 是否同步、JavaScript 语法、项目表述和联系方式一致性、STAR 结构回归、XML/SVG 合法性、本地资源链接、Git diff 格式，以及本地维护的简历成品是否存在且未过期。

这些检查是离线一致性门禁，不等同于上游事实更新、语义正确性证明或线上部署验证。更新项目指标时，应先核对对应仓库中的源码、配置、报告和运行边界，再同步网页及简历表述。

## 简历构建

本地安装 XeLaTeX 与 `latexmk` 后可运行：

```bash
make cv
make cv-zh
make cv-roles
```

- `make cv` 构建 `assets/CV.pdf`。
- `make cv-zh` 构建 `assets/cv/Agent开发与评测/李袖印_香港大学_Agent开发与评测_实习时长6个月.pdf`。
- `make cv-dev`、`make cv-eval` 分别构建 Agent 开发版和 Agent 评测版；`make cv-roles` 同时构建两者。
- Agent 开发版和 Agent 评测版是本地投递文件，不进入公开发布白名单。
- `assets/cv/` 按 `Agent开发`、`Agent评测`、`Agent开发与评测` 三个岗位方向归档；原始、手机号打码及匿名发布成品的命名约定见 `assets/cv/README.md`。

## 发布

网站通过 `main` 分支根目录发布到 GitHub Pages：

```bash
make deploy
make publish
make publish MSG="fix: update profile"
```

- `make deploy` 运行检查，仅暂存明确的发布白名单文件，然后提交并推送。
- `make publish` 先构建英文及通用中文简历，再执行部署和构建产物清理。
- 两个命令都会拒绝从非目标分支发布，也会拒绝意外暂存的文件。
- 普通 `make` 只显示帮助，不会提交或推送。

本地检查或 PDF 构建成功并不代表线上已更新。明确推送后，还需验证线上根主页、`zh.html` 兼容页和计划发布的文件；GitHub Pages 与浏览器缓存可能短暂保留旧版本。

## 内容维护原则

- 同一项目在网页和各简历中的角色、架构、指标和实验范围必须一致。
- 简历和主页优先描述已实现机制与可验证能力，详细限制放在网页展开说明或项目报告中。
- 评测数字必须能追溯到固定报告或提交，并保留样本、模型、配置和日期边界。
- MeetingAgent 的持久化任务恢复与 WebAgent 的检查点恢复属于不同机制，不应混写。
- 自动检查通过只能证明预设规则满足，不能替代真实 UI、线上状态和外部链接验证。

## 线上地址

- 主页：<https://lixiuyin.github.io>
- 兼容地址：<https://lixiuyin.github.io/zh.html>
