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

STEM = '보험료_세액공제_100만원_맞벌이_계산'
SLUG = 'insurance-premium-tax-credit-100m'


class InsurancePremiumPostTests(unittest.TestCase):
    def setUp(self):
        self.record = json.loads((ROOT / 'blog_post' / f'{SLUG}.production.json').read_text())

    def test_examples_and_separate_type_caps(self):
        examples = self.record['examples']
        for case in examples['website'] + [examples['tistory']]:
            self.assertEqual(min(case['paid'], 1000000), case['eligible'])
            self.assertEqual(Fraction(case['eligible'] * 12, 100), case['national'])
            self.assertEqual(Fraction(case['national'] * 110, 100), case['totalIllustration'])
        self.assertEqual(sum(examples['tistory']['premiums']), examples['tistory']['paid'])
        both = examples['websiteTypes']
        self.assertEqual(Fraction(min(both['ordinaryPaid'], 1000000) * 12, 100), both['ordinaryNational'])
        self.assertEqual(Fraction(min(both['disabilityPaid'], 1000000) * 15, 100), both['disabilityNational'])
        self.assertEqual(both['ordinaryNational'] + both['disabilityNational'], both['nationalTotal'])
        self.assertEqual(Fraction(both['nationalTotal'] * 110, 100), both['totalIllustration'])
        naver = examples['naver']
        self.assertEqual(naver['monthlyPaid'] * naver['months'] + naver['annualCarPaid'], naver['paid'])
        self.assertEqual(Fraction(min(naver['paid'], 1000000) * 12, 100), naver['national'])
        self.assertEqual(naver['spouseMonthlyPaid'] * naver['months'], naver['spousePaid'])
        self.assertEqual(Fraction(min(naver['spousePaid'], 1000000) * 12, 100), naver['spouseNational'])
        self.assertEqual(naver['national'] + naver['spouseNational'], naver['householdNational'])

    def test_tistory_layout_ads_and_package(self):
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
        for related in self.record['tistoryRelated']:
            self.assertIn(related['title'], post['body'])
            self.assertIn(related['url'], post['body'])
        package = ROOT / 'tistory_upload' / SLUG
        self.assertEqual(post['body'], (package / 'body.html').read_text().strip())
        self.assertEqual(post['title'], (package / 'title.txt').read_text().strip())
        self.assertEqual(len(post['tags'].split(', ')), 10)

    def test_three_platforms_and_naver_tags(self):
        website = blog_build.parse_post(ROOT / 'blog_post' / f'{STEM}.md')
        tistory = tistory_prepare.parse_tistory_post(ROOT / 'blog_post' / f'{STEM}_티스토리.txt')
        naver = (ROOT / 'blog_post' / f'{STEM}_네이버.txt').read_text()
        title = naver.split('[추천 제목]\n')[1].splitlines()[0]
        titles = {'website': website['title'], 'tistory': tistory['title'], 'naver': title}
        self.assertEqual(len(set(titles.values())), 3)
        for platform, text in titles.items():
            self.assertEqual(text, self.record['editorial'][platform]['title'])
        self.assertEqual(len(re.findall(r'^\d\. ', naver.split('[본문]')[0], re.MULTILINE)), 3)
        opening = ''.join(ElementTree.fromstring('<article>' + tistory['body'].replace('&nbsp;', '&#160;') + '</article>')[0].itertext())
        self.assertNotIn(opening, website['body_md'])
        self.assertNotIn(opening, naver)
        self.assertIn('240만원', website['body_md'])
        self.assertIn('암보험료 120만 원', tistory['body'])
        self.assertIn('매달 4만 원', naver)
        self.assertNotRegex(naver, r'</?(?:p|h2|img|a)\b')
        tags = re.findall(r'#([^\s#]+)', naver.split('[네이버 태그]')[1])
        self.assertEqual(len(tags), 26)
        self.assertEqual(len(set(tags)), len(tags))
        self.assertEqual(naver.count('https://taxcalc.co.kr/#income/employment'), 1)

    def test_accuracy_caveats_and_calculator_boundaries(self):
        for suffix in ('.md', '_티스토리.txt', '_네이버.txt'):
            text = (ROOT / 'blog_post' / (STEM + suffix)).read_text()
            for fact in ('2026년 귀속', '2026년 10월 14일', '100만 원', '12%', '15%', '500만 원', '20세 이하', '60세 이상', '실손보험금', '표준세액공제', '13만 원', '결정세액', '근로 제공기간', '입력칸'):
                self.assertIn(fact, text)
            self.assertNotRegex(text, r'저는.{0,10}(교수|세무사)')
        calculator = self.record['calculator']
        self.assertFalse(calculator['ordinaryCreditSupported'])
        self.assertFalse(calculator['disabilityCreditSupported'])
        self.assertTrue(calculator['insuranceInputIsIncomeDeduction'])
        rules = self.record['rules']
        self.assertFalse(rules['capPerInsurance'])
        self.assertFalse(rules['capPerDependent'])
        self.assertTrue(rules['separateTypeCaps'])

    def test_metadata_sitemap_and_three_images(self):
        page = (ROOT / 'blog' / f'{SLUG}.html').read_text()
        url = f'https://taxcalc.co.kr/blog/{SLUG}.html'
        self.assertIn(f'<link rel="canonical" href="{url}"', page)
        self.assertIn('"datePublished": "2026-10-14"', page)
        self.assertIn(f'https://taxcalc.co.kr/thumbnails/{SLUG}.webp', page)
        self.assertIn('보장성보험료 12%·15% 세액공제를 지원하지 않습니다.', page)
        self.assertNotIn('입력만 하면 즉시 결과 확인.', page)
        self.assertIn(f'/blog/{SLUG}.html', (ROOT / 'blog' / 'index.html').read_text())
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        matches = [n for n in ElementTree.parse(ROOT / 'sitemap.xml').findall('s:url', ns) if n.findtext('s:loc', namespaces=ns) == url]
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0].findtext('s:lastmod', namespaces=ns), '2026-10-14')
        hashes = set()
        for image in self.record['images']:
            data = (ROOT / image['file']).read_bytes()
            self.assertEqual(webp_size(data), tuple(image['size']))
            self.assertTrue(image['prompt'])
            hashes.add(hashlib.sha256(data).hexdigest())
        self.assertEqual(len(hashes), 3)


if __name__ == '__main__':
    unittest.main()
