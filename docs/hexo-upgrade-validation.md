# Hexo 与 NexT 升级及验证记录

## 范围与版本

基线：`hexo` 分支，提交 `12eac552a574f118ac167d23a6119e7e50a92234`。维护分支：`maintenance/hexo-next-upgrade`。验证日期：2026-10-28。

- Hexo：4.2.0 → 8.1.2；NexT：7.7.0 → 8.29.1。
- 固定 Node.js 24.19.0、npm 11.17.0；`.nvmrc`、`engines`、`packageManager` 记录运行环境。
- 更新全部保留的 Hexo 插件并固定直接依赖版本；使用 npm 官方源重建 lockfile v3。
- 主题从仓库内拷贝改为 npm 包；删除的是已迁移的 NexT 源码，文章未删除。未启用的 Landscape、Yilia、Zhaoo 保留，未执行它们的依赖安装。
- 运行根目录的 `npm ci`；不要在未启用的 Yilia 内安装旧 `node-sass`。

## 主题定制迁移

对比官方 NexT v7.7.0（`212e311a5671d2c27d3cc86593d3851ac570e79b`），差异集中于配置、中文菜单、页脚统计和打赏按钮。旧 `languages/default.yml` 的 `en.yml` 字面内容是旧符号链接拷贝痕迹，不迁移。

- Pisces、2019 起始版权年份、头像、社交链接、菜单、阅读进度、书签、GitHub 角标迁入 `_config.next.yml`。
- 相册和专题翻译迁入 `source/_data/languages.yml`，使用主题原生合并机制，保留完整中文翻译。
- 手写不蒜子页脚改为内置 `busuanzi_count`，保留访客及访问量，关闭原来未启用的文章访问量。
- 关闭入场动画，避免菜单在浏览器中持续透明；导航可见性不再依赖动画。
- 原打赏按钮只修正内联引号，且打赏未启用；采用新主题上游实现，不移植旧模板。
- 保留 FancyBox，关闭与之冲突的 Medium Zoom；保留本地搜索，关闭未配置凭据的 Algolia。
- 保留按页面启用的 MathJax，关闭冲突的 KaTeX。当前文章无数学公式，本次未验证数学渲染。
- 图片延迟加载改为 `marked.lazyload`；前端库通过 `scripts/local-vendors.js` 仅发布启用的资源，避免安装包含 Gitalk/Mermaid 等未使用依赖的合集。
- 移除未填写服务参数的 Disqus、DisqusJS、畅言、评分配置，以及值为 `true` 的无效搜索引擎验证码；它们原来无法正常提供功能。
- Valine 迁入 `hexo-next-valine`，迁移 `appId`、`appKey`、`meta`、`lang` 键名。修复扩展内联脚本早于 NexT `defer` 核心脚本执行的顺序问题，CDN 版本 1.4.14 → 1.5.3。
- 404 页去掉失效的外部公益页面依赖，使用本地中文提示；保留 GitHub Pages 需要的 `404.html`，修复 NexT 去掉规范链接 `.html` 的行为。

## 旧 Gulp 链路

根 `gulpfile.js` 使用 Gulp 3 的任务数组，根依赖没有声明 `gulp`；JS 匹配式 `public/**/.js` 无法覆盖预期文件，图片任务也未返回流。`npm run build` 从未调用它。

移除根 Gulp 文件及 5 个压缩插件，采用 `hexo generate` 的原有构建入口。不声称保留旧压缩效果：如需进一步压缩，应独立比较输出和收益后引入维护中的处理器。本次没有增加构建后压缩。

`hexo-related-popular-posts` 原配置 `enable: false`，未使用且依赖旧分析链路，因此移除。JSON 内容、RSS、站点地图、搜索、归档、标签及分类插件均保留并升级。

## Dependabot PR 逐项结论

检查时下列 7 个 PR 均开放、GitHub 标记可合并；可合并只代表文本冲突状态。没有合并、关闭或评论这些 PR。

| PR | 原升级内容 | 单独处理的判断 | 本次维护分支结果 |
| --- | --- | --- | --- |
| #10 | ajv 6.10.2 → 6.12.6 | 旧依赖链内兼容补丁候选；但主要收益来自先淘汰旧 Gulp，再重建锁文件 | 新活动依赖树不再含 ajv |
| #12 | moment 2.24.0 → 2.29.4 | 可直接合并候选，但仍须旧环境安装及构建验证；只修锁文件 | 重建后为 2.31.0 |
| #13 | moment-timezone 0.5.27 → 0.5.37 | 可直接合并候选，但仍须日期、时区及构建验证 | 重建后为 0.5.48 |
| #14 | decode-uri-component 0.2.0 → 0.2.2 | 旧链内兼容补丁候选；优先升级/移除父依赖后重建 | 新活动依赖树不再含该包 |
| #15 | Hexo、deployer、minimist、mkdirp | 必须连同主题升级并重建 lockfile；Hexo 4 → 6 跨主版本，不能只按补丁合并 | Hexo 8.1.2、deployer 4.0.0、minimist 1.2.8；旧 mkdirp 消失 |
| #16 | nunjucks 3.2.0 → 3.2.4 | 可直接合并候选，但须模板渲染验证 | Hexo 内置渲染器使用 3.2.4 |
| #17 | minimatch 3.0.4 → 3.1.2 | 可直接合并候选，但只改锁文件，不能修复构建链老化 | 重建后出现 3.1.5、5.1.9 |

这些历史补丁的目标已由新锁文件吸收或由父依赖移除消解；不要再机械地将旧锁文件补丁合入新分支。后续旧 PR 的处置由维护者决定。

## 实际验证

- `npm ci`：从锁文件重新安装成功；`npm ls --all` 依赖树通过。
- `npm run clean`、`npm run build`：成功，构建日志无 WARN、ERROR、FATAL；生成 133 个文件（包括全部本地前端资源）。
- `npm run test:links`：28 个 HTML 页面、1,235 个本地引用、3 个搜索条目通过；校验本地页面、资源、锚点、搜索结果路由及相册 11 张图片。
- 浏览器：Chrome，桌面 1440 × 1000、移动 390 × 844；验证中文菜单、Docker/Oracle 搜索、结果跳转、PJAX、专题文章链接、FancyBox、空搜索、移动端无横向溢出、本地资源无 HTTP 错误、页面无未捕获脚本错误。
- 评论测试使用 Valine 客户端替身，仅验证初始化时序；拦截其他全部外部请求。未验证线上评论读写、评论数量、访客统计、外链可达性、数学公式；没有发送评论或统计验证流量。
- 本地 Git 部署演练：将 `deploy.repo` 覆盖为工作区临时 bare 仓库，目标分支 `preview`；`hexo deploy --config _config.yml,../deploy-local.yml` 成功。确认输出中的 CNAME 可被读取。没有向生产 `master` 推送。
- 没有在旧 Node 8/10 环境重建历史 Hexo 4，因此不宣称完成旧版与新版逐像素对比；浏览器截图仅代表新版。

## 安全审计与边界

使用 `npm audit --registry=https://registry.npmjs.org --json`，最终 11 项 low、0 moderate、0 high、0 critical。审计返回非零是这些低危项造成，并非审计通过为零漏洞。

根因是 `deepmerge` 4.3.1 的原型污染公告 [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)，经 Hexo 工具链传播为 11 项受影响节点。当前依赖兼容范围内未找到修复版本，不使用 `npm audit fix --force` 所建议的旧主版本回退，也不强制跨主版本覆盖该核心合并库。静态发布不在生产运行 Node，但本地构建仍须仅使用受信任配置、主题与文章；等待上游兼容修复。

`js-yaml` 统一覆盖为已修复的 4.3.2，并经过构建验证。Gulp、node-sass、ajv、decode-uri-component 不在根活动依赖树。

Valine 通过 CDN 在浏览器运行，不属于 npm 审计覆盖范围。其独立扩展上游明确提示 Valine 非开源及 XSS/数据安全风险；升级到 1.5.3 不等于这些风险已全部消除。保留现有服务和配置以避免擅自迁移评论数据，生产发布前需维护者评估是否关闭 Valine 或单独规划迁移。真实服务访问未测试。

现有 `_config.yml` 的站点 URL 是 `http://b.wanty.cn`，但 `source/CNAME` 是 `ben.wanty.cn`。本次保持既有域名选择，未修改 DNS；生产部署前必须确认预期域名、HTTPS 和规范链接，不能将此不一致视为已解决。

## 本地复现

```bash
nvm use
npm ci --registry=https://registry.npmjs.org
npm audit --registry=https://registry.npmjs.org
npm run clean
npm run build
npm run test:links
npx playwright install chromium
npm run server -- --ip 127.0.0.1 --port 4000
# 另一个终端执行
npm run test:browser
```

浏览器验证截图与结果在忽略目录 `.qa/`。macOS 已安装 Chrome 时可通过 `CHROME_PATH` 指向 Chrome 可执行文件，跳过 Playwright 浏览器下载。

## 部署与回滚方案（本次未执行生产部署）

1. 审阅并合并维护 PR 到 `hexo`；先决定剩余低危项和 Valine 的风险接受方式，并确认域名。
2. 备份生产 `master` 当前提交 SHA、当前静态文件和 CNAME；记录本次源代码提交及 lockfile。
3. 以固定 Node/npm 从锁文件全新构建，在独立预览环境再次人工检查评论服务、外部统计、DNS/HTTPS、中文路径和搜索。不要在 PR 验证阶段执行带生产配置的 `npm run deploy`。
4. 只有维护者另行授权生产发布后，才使用 `_config.yml` 中的既有部署器发布至 `master`；发布后检查主页、三篇文章、404、搜索 XML、RSS、站点地图、评论及 CNAME。
5. 若发布异常，从备份的生产 SHA 在独立工作目录恢复旧静态文件，以一个新的回滚提交发布到 `master`，不强制改写历史。旧运行环境已过时，优先恢复已备份静态产物，不临时重装 Hexo 4。
6. 源码回滚：在 `hexo` 创建对本升级提交的 revert PR，审查后合并；源码回滚和生产静态文件回滚分别处理。无需删除或关闭任何旧 Dependabot PR。

## 参考

- [Hexo 8 发布说明](https://hexo.io/news/2025/09/16/hexo-8-0-0-released/)
- [NexT 跨版本升级说明](https://theme-next.js.org/docs/getting-started/upgrade)
- [Valine 扩展及其风险提示](https://github.com/next-theme/hexo-next-valine)
