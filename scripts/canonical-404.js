/* global hexo */
'use strict';

// NexT 会依据文章 permalink 去掉 .html；GitHub Pages 的错误页必须保留 404.html。
hexo.extend.filter.register('after_render:html', html => {
  if (!/<meta property="og:url" content="[^"]*\/404\.html"/.test(html)) return html;
  return html.replace(/(<link rel="canonical" href="[^"]*\/404)(")/, '$1.html$2');
});
