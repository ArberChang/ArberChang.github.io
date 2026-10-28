/* global hexo */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

// 仅发布本站启用的浏览器资源，避免插件合集引入未使用的依赖。
const assets = {
  '@fortawesome/fontawesome-free': ['css/all.min.css', 'webfonts'],
  '@fancyapps/ui': ['dist/fancybox'],
  '@next-theme/pjax': ['pjax.min.js'],
  pangu: ['dist/browser/pangu.umd.js'],
  quicklink: ['dist/quicklink.umd.js'],
  'animate.css': ['animate.min.css'],
  'hexo-generator-searchdb': ['dist/search.js']
};

hexo.extend.generator.register('local-vendors', () => {
  const routes = [];
  function add(name, relative) {
    const file = path.join(hexo.base_dir, 'node_modules', name, relative);
    if (fs.statSync(file).isDirectory()) {
      for (const child of fs.readdirSync(file)) add(name, path.posix.join(relative, child));
    } else {
      routes.push({ path: `lib/${name}/${relative}`, data: () => fs.createReadStream(file) });
    }
  }
  for (const [name, files] of Object.entries(assets)) {
    for (const file of files) add(name, file);
  }
  return routes;
});
