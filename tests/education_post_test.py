import json
import re
import sys
import unittest
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'build'))
import blog_build
import tistory_prepare

STEM = '교육비_세액공제_대학생_900만원_장학금_계산'
SLUG = 'education-tax-credit-university-900'


class EducationPostTests(unittest.TestCase):
    def test_tistory_layout_and_package(self):
        post = tistory_prepare.parse_tistory_post(ROOT / 'blog_post' / f'{STEM}_티스토리.txt')
        article = ElementTree.fromstring('<article>' + post['body'].replace('&nbsp;', '&#160;') + '</article>')
        nodes = list(article)
        blank = lambda n: n.tag == 'p' and not list(n) and not (n.text or '').strip()
        image = next(i for i, n in enumerate(nodes) if n.find('img') is not None)
        heading = next(i for i, n in enumerate(nodes) if n.tag == 'h2')
        self.assertGreater(image, 0)
        self.assertLess(image, heading)
        self.assertTrue(all(n.tag == 'p' for n in nodes[:image]))
        for n in nodes:
            if n.tag == 'p':
                self.assertEqual(n.get('data-ke-size'), 'size16')
        ads = [i for i, n in enumerate(nodes) if n.tag == 'center' and n.find('ins') is not None]
        self.assertEqual(len(ads), 2)
        for i in ads:
            self.assertEqual(nodes[i - 1].tag, 'h2')
            self.assertEqual(nodes[i + 1].tag, 'p')
            self.assertFalse(blank(nodes[i + 1]))
            self.assertEqual(nodes[i].find('ins').get('data-ad-client'), 'ca-pub-2792604427181547')
        self.assertFalse(any(blank(a) and blank(b) for a, b in zip(nodes, nodes[1:])))
        self.assertNotIn('공식 자료</h2>', post['body'])
        self.assertIn('함께 읽으면 좋은 글</h2>', post['body'])
        self.assertEqual(post['body'], (ROOT / 'tistory_upload' / SLUG / 'body.html').read_text().strip())
        self.assertIn('서론 다음, 첫 소제목 앞', (ROOT / 'tistory_upload' / SLUG / 'upload-helper.html').read_text())

    def test_platform_differentiation(self):
        website = blog_build.parse_post(ROOT / 'blog_post' / f'{STEM}.md')
        tistory = tistory_prepare.parse_tistory_post(ROOT / 'blog_post' / f'{STEM}_티스토리.txt')
        naver = (ROOT / 'blog_post' / f'{STEM}_네이버.txt').read_text()
        self.assertEqual(len(re.findall(r'^\d\. ', naver.split('[본문]')[0], re.MULTILINE)), 3)
        naver_title = naver.split('[본문]\n')[1].splitlines()[0]
        self.assertEqual(len({website['title'], tistory['title'], naver_title}), 3)
        self.assertNotRegex(naver, r'</?(?:p|h2|img|a)\b')
        tags = re.findall(r'#([^\s#]+)', naver.split('[네이버 태그]')[1])
        self.assertEqual(len(tags), 26)
        self.assertEqual(len(tags), len(set(tags)))
        opening = ElementTree.fromstring('<article>' + tistory['body'].replace('&nbsp;', '&#160;') + '</article>')[0].text
        self.assertNotIn(opening, website['body_md'])
        self.assertNotIn(opening, naver)
        self.assertIn('1,200만 원', website['body_md'])
        self.assertIn('1,000만 원', tistory['body'])
        self.assertIn('780만 원', naver)
        self.assertEqual(naver.count('https://taxcalc.co.kr/#income/employment'), 1)

    def test_examples_and_2026_change(self):
        record = json.loads((ROOT / 'blog_post' / f'{SLUG}.production.json').read_text())
        cases = record['examples']['website'] + [record['examples']['tistory'], record['examples']['naver']]
        for case in cases:
            self.assertEqual(case['tuition'] - case['scholarship'] - case['eligibleStudentLoan'], case['parentExpense'])
            self.assertEqual(min(case['parentExpense'], 9000000), case['base'])
            self.assertEqual(case['base'] * 15 // 100, case['credit'])
        for suffix in ('.md', '_티스토리.txt', '_네이버.txt'):
            text = (ROOT / 'blog_post' / (STEM + suffix)).read_text()
            self.assertIn('2026년 1월 1일', text)
            self.assertIn('소득요건', text)
            self.assertIn('기본공제', text)
            self.assertIn('환급', text)
            self.assertIn('자동', text)
        self.assertFalse(record['calculator']['exclusionsAndCapAutomatic'])

    def test_published_page_and_sitemap(self):
        html = (ROOT / 'blog' / f'{SLUG}.html').read_text()
        url = f'https://taxcalc.co.kr/blog/{SLUG}.html'
        self.assertIn(f'<link rel="canonical" href="{url}"', html)
        self.assertIn(f'https://taxcalc.co.kr/thumbnails/{SLUG}.webp', html)
        self.assertIn('https://taxcalc.co.kr/income/employment.html', html)
        self.assertIn('"datePublished": "2026-10-08"', html)
        tree = ElementTree.parse(ROOT / 'sitemap.xml')
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        entries = [e for e in tree.findall('s:url', ns) if e.findtext('s:loc', namespaces=ns) == url]
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0].findtext('s:lastmod', namespaces=ns), '2026-10-08')


if __name__ == '__main__':
    unittest.main()
