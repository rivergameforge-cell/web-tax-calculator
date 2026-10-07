"""Run with python3 -m unittest discover -s tests -p '*_test.py'."""
import hashlib
import json
import re
import subprocess
import sys
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'build'))
import build as builder
import blog_build
import tistory_prepare
from site_html import SiteHTML


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.hrefs, self.resources, self.schemas = [], [], [], []
        self.h1 = self.inputs = 0
        self.canonical = None
        self.script = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'a':
            self.hrefs.append(attrs.get('href', ''))
        if tag == 'h1':
            self.h1 += 1
        if tag in ('input', 'select', 'textarea'):
            self.inputs += 1
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs['href']
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.script = ''
        if tag in ('script', 'img', 'link'):
            resource = attrs.get('src') if tag != 'link' else attrs.get('href')
            if resource:
                self.resources.append(resource)

    def handle_data(self, data):
        if self.script is not None:
            self.script += data

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.schemas.append(json.loads(self.script))
            self.script = None


class SiteTests(unittest.TestCase):
    def test_all_sitemap_documents(self):
        tree = ElementTree.parse(ROOT / 'sitemap.xml')
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        entries = tree.findall('s:url', ns)
        self.assertEqual(len(entries), 100)
        functional = 0
        titles = set()
        for entry in entries:
            url = entry.findtext('s:loc', namespaces=ns)
            route = unquote(urlsplit(url).path)
            path = ROOT / (route.strip('/') + ('/index.html' if route.endswith('/') else ''))
            if route == '/':
                path = ROOT / 'index.html'
            text = path.read_text()
            with self.subTest(url=url):
                doc = Document(text)
                self.assertEqual(doc.canonical, url)
                self.assertEqual(doc.h1, 1)
                self.assertEqual(len(doc.ids), len(set(doc.ids)))
                self.assertNotIn('noindex', text.lower())
                self.assertNotIn('{{', text)
                title = re.search(r'<title>(.*?)</title>', text).group(1)
                self.assertNotIn(title, titles)
                titles.add(title)
                for href in doc.hrefs + doc.resources:
                    parts = urlsplit(href)
                    if parts.netloc and parts.netloc != 'taxcalc.co.kr':
                        continue
                    if parts.scheme not in ('', 'http', 'https'):
                        continue
                    target = ROOT / unquote(parts.path.lstrip('/')) if parts.path.startswith('/') else path.parent / unquote(parts.path)
                    if not parts.path:
                        target = path
                    if target.is_dir():
                        target /= 'index.html'
                    self.assertTrue(target.exists(), (path, href))
                    if parts.fragment and parts.fragment.startswith('calculators-'):
                        self.assertIn(parts.fragment, Document(target.read_text()).ids)
                if route.count('/') == 2 and not route.startswith('/blog/'):
                    self.assertIn('TaxCalc Korea', title)
                    self.assertIn('공식 자료와 확인 기준', text)
                    self.assertTrue(any(domain in text for domain in ('law.go.kr', 'fsc.go.kr', 'astro.kasi.re.kr')))
                    schemas = [item for group in doc.schemas for item in (group if isinstance(group, list) else [group])]
                    webpage = next(item for item in schemas if item['@type'] == 'WebPage')
                    self.assertEqual(webpage['dateModified'], entry.findtext('s:lastmod', namespaces=ns))
                    self.assertLessEqual(webpage['datePublished'], webpage['dateModified'])
                    apps = [item for item in schemas if item['@type'] == 'WebApplication']
                    self.assertEqual(bool(apps), bool(doc.inputs))
                    if apps:
                        functional += 1
                        self.assertEqual(apps[0]['url'], url)
                        self.assertIn('calculatorReady', text)
        self.assertEqual(functional, 46)

    def test_exact_nested_markup_extraction(self):
        source = '<section id="outer"><div><p>A &amp; B</p><input id="input"><div id="inner">I</div></div><script>const x="<div>";</script></section>'
        parsed = SiteHTML(source)
        self.assertEqual(parsed.elements['outer'], source)
        self.assertEqual(parsed.elements['inner'], '<div id="inner">I</div>')

    def test_dates_are_stable(self):
        path = ROOT / 'income/corporate.html'
        key = path.relative_to(ROOT).as_posix()
        previous = builder.DATES[key].copy()
        digest = hashlib.sha256(b'unchanged fixture').hexdigest()
        builder.DATES[key] = dict(previous, digest=digest)
        self.assertEqual(builder.document_dates(path, 'unchanged fixture'), builder.DATES[key])
        builder.DATES[key] = previous

    def test_build_is_idempotent(self):
        paths = [ROOT / 'sitemap.xml', ROOT / 'build/page_dates.json', ROOT / 'index.html', ROOT / 'blog/index.html']
        paths += [ROOT / f'{meta["id"]}.html' for meta in builder.load_all_content().values()]
        before = {path: path.read_bytes() for path in paths}
        subprocess.run([sys.executable, 'build/blog_build.py', '--index-only'], cwd=ROOT,
                       check=True, capture_output=True)
        for _ in range(2):
            subprocess.run([sys.executable, 'build/build.py'], cwd=ROOT, check=True, capture_output=True)
        self.assertEqual(before, {path: path.read_bytes() for path in paths})

    def test_faq_json_cannot_end_script(self):
        result = builder.render_faq_jsonld([{'q': 'q </script>', 'a': 'a " & <'}])
        self.assertEqual(result.count('</script>'), 1)
        Document(result)

    def test_blog_table_and_canonical_link(self):
        html = blog_build.md_to_html('| A | B |\n| --- | --- |\n| <x> | **2** |')
        self.assertIn('<table>', html)
        self.assertIn('&lt;x&gt;', html)
        self.assertIn('<strong>2</strong>', html)
        self.assertEqual(blog_build.canonical_calculator_links('/#income/vat'), '/income/vat.html')

    def test_related_guides_are_unique(self):
        route = 'test/medical-guide'
        guide = (ROOT / 'blog/medical-expense-tax-credit-3-percent.html', '의료비 공제', '2026-10-07')
        builder.GUIDES[route] = [guide, guide]
        try:
            self.assertEqual(builder.render_guides(route).count('medical-expense-tax-credit-3-percent.html'), 1)
        finally:
            del builder.GUIDES[route]

    def test_medical_tistory_article_layout(self):
        source = ROOT / 'blog_post/의료비_세액공제_3퍼센트_실손보험금_티스토리.txt'
        post = tistory_prepare.parse_tistory_post(source)
        article = ElementTree.fromstring('<article>' + post['body'].replace('&nbsp;', '&#160;') + '</article>')
        nodes = list(article)
        blank = lambda node: node.tag == 'p' and not list(node) and not (node.text or '').strip()
        self.assertTrue(blank(nodes[1]))
        self.assertTrue(blank(nodes[3]))
        image_index = next(i for i, node in enumerate(nodes) if node.find('img') is not None)
        heading_index = next(i for i, node in enumerate(nodes) if node.tag == 'h2')
        self.assertGreater(image_index, 0)
        self.assertLess(image_index, heading_index)
        ads = [i for i, node in enumerate(nodes) if node.tag == 'center' and node.find('ins') is not None]
        self.assertEqual(len(ads), 2)
        for i in ads:
            self.assertEqual(nodes[i - 1].tag, 'h2')
            self.assertEqual(nodes[i + 1].tag, 'p')
            self.assertFalse(blank(nodes[i + 1]))
        self.assertFalse(any(blank(a) and blank(b) for a, b in zip(nodes, nodes[1:])))
        self.assertEqual(post['body'], (ROOT / 'tistory_upload/medical-expense-tax-credit-3-percent/body.html').read_text().strip())


if __name__ == '__main__':
    unittest.main()
