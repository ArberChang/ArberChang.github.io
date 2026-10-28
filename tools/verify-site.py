#!/usr/bin/env python3
"""检查生成站点的本地页面、资源、锚点及搜索索引。"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET
import json

root = Path('public').resolve()
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.links=[]; self.ids=set(); self.feed(text)
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.add(a['id'])
        for attr in ('href', 'src'):
            if a.get(attr): self.links.append(a[attr])

pages={p:Page(p.read_text()) for p in root.rglob('*.html')}
errors=[]; checked=0; external=set()
for p, page in pages.items():
    assert p.stat().st_size > 500, f'页面为空: {p}'
    for link in page.links:
        u=urlsplit(link)
        if u.scheme in ('mailto','tel','data','javascript'): continue
        if u.netloc:
            if u.netloc not in ('b.wanty.cn','arberchang.github.io'):
                external.add(link); continue
        target=(root/unquote(u.path).lstrip('/')) if u.path.startswith('/') else (p.parent/unquote(u.path))
        if not u.path: target=p
        if target.is_dir(): target=target/'index.html'
        if not target.exists(): errors.append({'page':str(p.relative_to(root)), 'link':link}); continue
        checked+=1
        if u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:
            errors.append({'page':str(p.relative_to(root)), 'link':link, 'reason':'缺少锚点'})
entries=ET.parse(root/'search.xml').getroot().findall('entry')
assert len(entries)==3, f'搜索条目异常: {len(entries)}'
for entry in entries:
    assert entry.findtext('title') and entry.findtext('content')
    path=root/unquote(urlsplit(entry.findtext('url')).path).lstrip('/')/'index.html'
    assert path.exists(), f'搜索结果页面不存在: {path}'
for name in ['index.html','archives/index.html','about/index.html','tags/index.html','categories/index.html','series/index.html','photos/index.html','404.html','sitemap.xml','atom.xml','content.json','CNAME']:
    assert (root/name).is_file(), name
assert (root/'photos/index.html').read_text().count('group-picture-column') == 11
assert '相册' in (root/'index.html').read_text() and '专题' in (root/'index.html').read_text()
result={'html_pages':len(pages),'checked_local_links':checked,'search_entries':len(entries),'external_urls_not_requested':len(external),'errors':errors}
print(json.dumps(result,ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
