import hashlib
import json
import re
import sys
import unittest
from fractions import Fraction
from pathlib import Path
from xml.etree import ElementTree

from housing_subscription_post_test import webp_size

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'build'))
import blog_build
import tistory_prepare

STEM = '중소기업_취업자_소득세_감면_90_계산'
SLUG = 'sme-employee-income-tax-reduction'


class SmeTaxReductionPostTests(unittest.TestCase):
    def setUp(self):
        self.record = json.loads((ROOT / 'blog_post' / f'{SLUG}.production.json').read_text())

    def test_relief_and_credit_adjustment_examples(self):
        examples = self.record['examples']
        cases = examples['websiteAll'] + [examples[key] for key in ('websiteMixed', 'tistory', 'naver')]
        for case in cases:
            result = min(Fraction(case['calculatedTax'] * case['eligibleSalary'] * 9, case['totalSalary'] * 10), 2000000)
            self.assertEqual(result, case['relief'])
        case = examples['websiteCredit']
        credit = case['ordinaryCredit'] * (1 - Fraction(case['relief'], case['calculatedTax']))
        self.assertEqual(credit, case['adjustedCredit'])
        self.assertEqual(case['calculatedTax'] - case['ordinaryCredit'], case['determinedBefore'])
        self.assertEqual(case['calculatedTax'] - case['relief'] - credit, case['determinedAfter'])
        self.assertEqual(case['determinedBefore'] - case['determinedAfter'], case['difference'])
        self.assertNotEqual(case['relief'], case['difference'])

    def test_tistory_html_layout_ads_and_package(self):
        post = tistory_prepare.parse_tistory_post(ROOT / 'blog_post' / f'{STEM}_티스토리.txt')
        nodes = list(ElementTree.fromstring('<article>' + post['body'].replace('&nbsp;', '&#160;') + '</article>'))
        blank = lambda n: n.tag == 'p' and not list(n) and not (n.text or '').strip()
        image = next(i for i, n in enumerate(nodes) if n.find('img') is not None)
        first_heading = next(i for i, n in enumerate(nodes) if n.tag == 'h2')
        self.assertLess(image, first_heading)
        self.assertEqual(len([n for n in nodes[:image] if not blank(n)]), 3)
        self.assertEqual(nodes[image].find('img').get('width'), '1080')
        self.assertTrue(all(n.get('data-ke-size') == 'size16' for n in nodes if n.tag == 'p'))
        self.assertFalse(any(blank(a) and blank(b) for a, b in zip(nodes, nodes[1:])))
        ads = [i for i, n in enumerate(nodes) if n.tag == 'center' and n.find('ins') is not None]
        self.assertEqual(len(ads), 2)
        for i in ads:
            self.assertEqual(nodes[i - 1].tag, 'h2')
            self.assertEqual(nodes[i + 1].tag, 'p')
            self.assertFalse(blank(nodes[i + 1]))
            self.assertEqual(nodes[i].find('ins').get('data-ad-client'), 'ca-pub-2792604427181547')
            self.assertEqual(nodes[i].find('ins').get('data-ad-slot'), '4883327520')
        self.assertIn('함께 읽으면 좋은 글</h2>', post['body'])
        self.assertNotIn('공식 자료</h2>', post['body'])
        for related in self.record['tistoryRelated']:
            self.assertIn(related['title'], post['body'])
            self.assertIn(related['url'], post['body'])
        package = ROOT / 'tistory_upload' / SLUG
        self.assertEqual(post['body'], (package / 'body.html').read_text().strip())
        self.assertEqual(post['title'], (package / 'title.txt').read_text().strip())
        self.assertEqual(len(post['tags'].split(', ')), 10)

    def test_platform_differences_and_naver_tags(self):
        website = blog_build.parse_post(ROOT / 'blog_post' / f'{STEM}.md')
        tistory = tistory_prepare.parse_tistory_post(ROOT / 'blog_post' / f'{STEM}_티스토리.txt')
        naver = (ROOT / 'blog_post' / f'{STEM}_네이버.txt').read_text()
        naver_title = naver.split('[본문]\n')[1].splitlines()[0]
        self.assertEqual(len({website['title'], tistory['title'], naver_title}), 3)
        for platform, title in [('website', website['title']), ('tistory', tistory['title']), ('naver', naver_title)]:
            self.assertEqual(title, self.record['editorial'][platform]['title'])
        self.assertEqual(len(re.findall(r'^\d\. ', naver.split('[본문]')[0], re.MULTILINE)), 3)
        opening = ElementTree.fromstring('<article>' + tistory['body'].replace('&nbsp;', '&#160;') + '</article>')[0]
        self.assertNotIn(''.join(opening.itertext()), website['body_md'])
        self.assertNotIn(''.join(opening.itertext()), naver)
        self.assertIn('156만 원', website['body_md'])
        self.assertIn('144만 원', tistory['body'])
        self.assertIn('108만 원', naver)
        self.assertNotRegex(naver, r'</?(?:p|h2|img|a)\b')
        tags = re.findall(r'#([^\s#]+)', naver.split('[네이버 태그]')[1])
        self.assertEqual(len(tags), 26)
        self.assertEqual(len(set(tags)), len(tags))
        self.assertEqual(naver.count('https://taxcalc.co.kr/#income/employment'), 1)

    def test_material_rules_and_calculator_limitations(self):
        for suffix in ('.md', '_티스토리.txt', '_네이버.txt'):
            text = (ROOT / 'blog_post' / (STEM + suffix)).read_text()
            for fact in ('2026년 귀속', '2026년 12월 31일', '2025년 2월 28일', '34세', '6년', '200만 원', '4대보험', '연말정산세액의 납부기한', '법정신고기한', '근로소득세액공제', '자동', '환급'):
                self.assertIn(fact, text)
        self.assertFalse(self.record['calculator']['eligibilityAutomatic'])
        self.assertFalse(self.record['calculator']['reliefAutomatic'])
        self.assertFalse(self.record['calculator']['creditAdjustmentAutomatic'])
        self.assertEqual(self.record['rules']['employmentCutoff'], '2026-12-31')
        self.assertEqual(self.record['rules']['taxYearCap'], 2000000)

    def test_site_dates_sitemap_and_distinct_images(self):
        html = (ROOT / 'blog' / f'{SLUG}.html').read_text()
        url = f'https://taxcalc.co.kr/blog/{SLUG}.html'
        self.assertIn(f'<link rel="canonical" href="{url}"', html)
        self.assertIn('"datePublished": "2026-10-10"', html)
        self.assertIn(f'https://taxcalc.co.kr/thumbnails/{SLUG}.webp', html)
        self.assertIn(f'/blog/{SLUG}.html', (ROOT / 'blog' / 'index.html').read_text())
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        entries = [n for n in ElementTree.parse(ROOT / 'sitemap.xml').findall('s:url', ns) if n.findtext('s:loc', namespaces=ns) == url]
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0].findtext('s:lastmod', namespaces=ns), '2026-10-10')
        hashes = set()
        for asset in self.record['images']:
            data = (ROOT / asset['file']).read_bytes()
            self.assertEqual(webp_size(data), tuple(asset['size']))
            self.assertTrue(asset['prompt'])
            hashes.add(hashlib.sha256(data).hexdigest())
        self.assertEqual(len(hashes), 3)


if __name__ == '__main__':
    unittest.main()
