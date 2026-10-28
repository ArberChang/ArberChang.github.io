/* global hexo */
'use strict';

// 旧评论扩展输出同步脚本，NexT 8 的核心脚本则使用 defer。
// 等核心脚本就绪后再初始化，同时支持 PJAX 中的再次执行。
hexo.extend.filter.register('theme_inject', injects => {
  for (const view of injects.bodyEnd.raws) {
    if (view.name !== 'valine.njk') continue;
    view.raw = view.raw.replace('https://cdn.jsdelivr.net/npm/valine@1.4.14/dist/Valine.min.js', 'https://cdn.jsdelivr.net/npm/valine@1.5.3/dist/Valine.min.js').replace('<script>', '<script>\n(() => {\nconst initialize = () => {')
      .replace('</script>', `\n};\nif (document.readyState === 'loading') {\n  document.addEventListener('DOMContentLoaded', initialize, { once: true });\n} else {\n  initialize();\n}\n})();\n</script>`);
  }
}, 20);
