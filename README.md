# ArberChang.github.io

使用 Hexo 8.1.2 与 NexT 8.29.1 的博客源代码。

```bash
nvm use
npm ci --registry=https://registry.npmjs.org
npm run build
npm run test:links
npm run server
```

主题定制位于 `_config.next.yml`、`source/_data/` 和 `scripts/`。只在根目录安装依赖，不要在未启用的旧主题目录内运行安装。

升级变更、安全审计、Dependabot PR 判断、本地浏览器验证和部署/回滚方案见 [升级验证记录](docs/hexo-upgrade-validation.md)。

`npm run deploy` 会按 `_config.yml` 发布至生产 `master`，仅在维护者明确授权发布后运行。日常构建和浏览器验证无需部署。
