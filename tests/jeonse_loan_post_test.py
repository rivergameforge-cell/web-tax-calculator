import hashlib
import json
import re
import sys
import unittest
from fractions import Fraction
from pathlib import Path
from xml.etree import ElementTree

from housing_subscription_post_test import webp_size
from mortgage_interest_post_test import calculated_tax

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'build'))
import blog_build
import tistory_prepare

STEM = '전세대출_소득공제_원리금40_청약합산400_계산'
SLUG = 'jeonse-loan-principal-interest-deduction'


class JeonseLoanPostTests(unittest.TestCase):
    def setUp(self):
        self.record = json.loads((ROOT / 'blog_post' / f'{SLUG}.production.json').read_text())

    def test_examples_rate_shared_cap_and_tax(self):
        examples = self.record['examples']
        cases = examples['website'] + [examples['tistory'], examples['naver']]
        for case in cases:
            self.assertEqual(Fraction((case['principal'] + case['interest']) * 40, 100), case['loanUncapped'])
            self.assertEqual(Fraction(case['subscriptionPaid'] * 40, 100), case['subscriptionDeduction'])
            self.assertEqual(min(case['loanUncapped'], 4000000 - case['subscriptionDeduction']), case['loanDeduction'])
            self.assertEqual(case['loanDeduction'] + case['subscriptionDeduction'], case['combined'])
        naver = examples['naver']
        for monthly, annual in [('monthlyPrincipal', 'principal'), ('monthlyInterest', 'interest'), ('monthlySubscription', 'subscriptionPaid')]:
            self.assertEqual(naver[monthly] * naver['months'], naver[annual])
        for case in examples['tax']:
            self.assertEqual(case['baseBefore'] - case['deduction'], case['baseAfter'])
            self.assertEqual(calculated_tax(case['baseBefore']), case['taxBefore'])
            self.assertEqual(calculated_tax(case['baseAfter']), case['taxAfter'])
            self.assertEqual(case['taxBefore'] - case['taxAfter'], case['difference'])
        for case in examples['flatTaxComparisons']:
            self.assertEqual(Fraction(case['deduction'] * case['ratePercent'], 100), case['difference'])

    def test_tistory_layout_ad_slots_and_upload_package(self):
        post = tistory_prepare.parse_tistory_post(ROOT / 'blog_post' / f'{STEM}_티스토리.txt')
        nodes = list(ElementTree.fromstring('<article>' + post['body'].replace('&nbsp;', '&#160;') + '</article>'))
        blank = lambda n: n.tag == 'p' and not list(n) and not (n.text or '').strip()
        image = next(i for i, n in enumerate(nodes) if n.find('img') is not None)
        heading = next(i for i, n in enumerate(nodes) if n.tag == 'h2')
        self.assertLess(image, heading)
        self.assertEqual(sum(not blank(n) for n in nodes[:image]), 3)
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
        self.assertNotIn('공식 자료</h2>', post['body'])
        self.assertIn('함께 읽으면 좋은 글</h2>', post['body'])
        for related in self.record['tistoryRelated']:
            self.assertIn(related['title'], post['body'])
            self.assertIn(related['url'], post['body'])
        self.assertEqual(post['body'], (ROOT / 'tistory_upload' / SLUG / 'body.html').read_text().strip())
        self.assertEqual(len(post['tags'].split(', ')), 10)

    def test_platform_differentiation_and_naver_delivery(self):
        website = blog_build.parse_post(ROOT / 'blog_post' / f'{STEM}.md')
        tistory = tistory_prepare.parse_tistory_post(ROOT / 'blog_post' / f'{STEM}_티스토리.txt')
        naver = (ROOT / 'blog_post' / f'{STEM}_네이버.txt').read_text()
        title = naver.split('[추천 제목]\n')[1].splitlines()[0]
        titles = {'website': website['title'], 'tistory': tistory['title'], 'naver': title}
        self.assertEqual(len(set(titles.values())), 3)
        for platform, text in titles.items():
            self.assertEqual(text, self.record['editorial'][platform]['title'])
        self.assertEqual(len(re.findall(r'^\d\. ', naver.split('[본문]')[0], re.MULTILINE)), 3)
        tistory_opening = ''.join(ElementTree.fromstring('<article>' + tistory['body'].replace('&nbsp;', '&#160;') + '</article>')[0].itertext())
        self.assertNotIn(tistory_opening, website['body_md'])
        self.assertNotIn(tistory_opening, naver)
        self.assertIn('720만 원', website['body_md'])
        self.assertIn('원금 600만 원', tistory['body'])
        self.assertIn('매달 원금 20만 원', naver)
        self.assertNotRegex(naver, r'</?(?:p|h2|img|a)\b')
        tags = re.findall(r'#([^\s#]+)', naver.split('[네이버 태그]')[1])
        self.assertEqual(len(tags), 26)
        self.assertEqual(len(set(tags)), len(tags))
        self.assertEqual(naver.count('https://taxcalc.co.kr/income/employment.html'), 1)

    def test_rules_and_calculator_limitations_are_explicit(self):
        for suffix in ('.md', '_티스토리.txt', '_네이버.txt'):
            text = (ROOT / 'blog_post' / (STEM + suffix)).read_text()
            for fact in ('2026년 귀속', '2026년 10월 13일', '40%', '400만 원', '85㎡', '100㎡', '3개월', '1개월', '5,000만 원', '3.1%', '2,500만 원', '근로', '자동', '환급'):
                self.assertIn(fact, text)
            self.assertNotRegex(text, r'저는.{0,10}(교수|세무사)')
        rules = self.record['rules']
        self.assertTrue(rules['principalIncluded'])
        self.assertIsNone(rules['bankSeparateSalaryCap'])
        self.assertEqual(rules['yearEndHouseholdHomeMax'], 0)
        self.assertEqual(rules['combinedCap'], 4000000)
        for key in ('eligibilityAutomatic', 'rateAutomatic', 'combinedCapAutomatic', 'aggregateCapAutomatic'):
            self.assertFalse(self.record['calculator'][key])

    def test_site_metadata_sitemap_and_distinct_asset_dimensions(self):
        page = (ROOT / 'blog' / f'{SLUG}.html').read_text()
        url = f'https://taxcalc.co.kr/blog/{SLUG}.html'
        self.assertIn(f'<link rel="canonical" href="{url}"', page)
        self.assertIn('"datePublished": "2026-10-13"', page)
        self.assertIn(f'https://taxcalc.co.kr/thumbnails/{SLUG}.webp', page)
        self.assertIn(f'/blog/{SLUG}.html', (ROOT / 'blog' / 'index.html').read_text())
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        matches = [n for n in ElementTree.parse(ROOT / 'sitemap.xml').findall('s:url', ns) if n.findtext('s:loc', namespaces=ns) == url]
        self.assertEqual(len(matches), 1)
        self.assertGreaterEqual(matches[0].findtext('s:lastmod', namespaces=ns), '2026-10-13')
        hashes = set()
        for image in self.record['images']:
            data = (ROOT / image['file']).read_bytes()
            self.assertEqual(webp_size(data), tuple(image['size']))
            self.assertTrue(image['prompt'])
            hashes.add(hashlib.sha256(data).hexdigest())
        self.assertEqual(len(hashes), 3)


if __name__ == '__main__':
    unittest.main()
