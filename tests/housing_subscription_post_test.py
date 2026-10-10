import hashlib
import json
import re
import struct
import sys
import unittest
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'build'))
import blog_build
import tistory_prepare

STEM = '주택청약_소득공제_300만원_무주택_계산'
SLUG = 'housing-subscription-income-deduction'


def webp_size(data):
    if data[:4] != b'RIFF' or data[8:12] != b'WEBP':
        raise ValueError('Not a WebP image')
    offset = 12
    while offset + 8 <= len(data):
        kind = data[offset:offset + 4]
        length = int.from_bytes(data[offset + 4:offset + 8], 'little')
        payload = data[offset + 8:offset + 8 + length]
        if kind == b'VP8 ' and payload[3:6] == b'\x9d\x01\x2a':
            return tuple(value & 0x3fff for value in struct.unpack('<HH', payload[6:10]))
        if kind == b'VP8X':
            return tuple(1 + int.from_bytes(payload[i:i + 3], 'little') for i in (4, 7))
        if kind == b'VP8L' and payload[0] == 0x2f:
            bits = int.from_bytes(payload[1:5], 'little')
            return (1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff))
        offset += 8 + length + (length % 2)
    raise ValueError('Missing WebP dimensions')


def calculated_tax(base):
    return base * 6 // 100 if base <= 14000000 else base * 15 // 100 - 1260000


class HousingSubscriptionPostTests(unittest.TestCase):
    def setUp(self):
        self.record = json.loads((ROOT / 'blog_post' / f'{SLUG}.production.json').read_text())

    def test_tistory_layout_and_package(self):
        post = tistory_prepare.parse_tistory_post(ROOT / 'blog_post' / f'{STEM}_티스토리.txt')
        article = ElementTree.fromstring('<article>' + post['body'].replace('&nbsp;', '&#160;') + '</article>')
        nodes = list(article)
        blank = lambda n: n.tag == 'p' and not list(n) and not (n.text or '').strip()
        image = next(i for i, n in enumerate(nodes) if n.find('img') is not None)
        heading = next(i for i, n in enumerate(nodes) if n.tag == 'h2')
        intro = [n for n in nodes[:image] if not blank(n)]
        self.assertEqual(len(intro), 3)
        self.assertTrue(all(n.tag == 'p' for n in intro))
        self.assertLess(image, heading)
        self.assertEqual(nodes[image].find('img').get('width'), '1080')
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
            self.assertEqual(nodes[i].find('ins').get('data-ad-slot'), '4883327520')
        self.assertFalse(any(blank(a) and blank(b) for a, b in zip(nodes, nodes[1:])))
        self.assertNotIn('공식 자료</h2>', post['body'])
        self.assertIn('함께 읽으면 좋은 글</h2>', post['body'])
        for related in self.record['tistoryRelated']:
            self.assertIn(related['url'], post['body'])
            self.assertIn(related['title'], post['body'])
        package = ROOT / 'tistory_upload' / SLUG
        self.assertEqual(post['body'], (package / 'body.html').read_text().strip())
        self.assertEqual(post['title'], (package / 'title.txt').read_text().strip())
        self.assertEqual(len(post['tags'].split(', ')), 10)
        self.assertIn('서론 다음, 첫 소제목 앞', (package / 'upload-helper.html').read_text())

    def test_distinct_titles_openings_and_naver_tags(self):
        website = blog_build.parse_post(ROOT / 'blog_post' / f'{STEM}.md')
        tistory = tistory_prepare.parse_tistory_post(ROOT / 'blog_post' / f'{STEM}_티스토리.txt')
        naver = (ROOT / 'blog_post' / f'{STEM}_네이버.txt').read_text()
        self.assertEqual(len(re.findall(r'^\d\. ', naver.split('[본문]')[0], re.MULTILINE)), 3)
        naver_title = naver.split('[본문]\n')[1].splitlines()[0]
        self.assertEqual(len({website['title'], tistory['title'], naver_title}), 3)
        for platform, title in [('website', website['title']), ('tistory', tistory['title']), ('naver', naver_title)]:
            self.assertEqual(title, self.record['editorial'][platform]['title'])
        opening = ElementTree.fromstring('<article>' + tistory['body'].replace('&nbsp;', '&#160;') + '</article>')[0]
        self.assertNotIn(''.join(opening.itertext()), website['body_md'])
        self.assertNotIn(''.join(opening.itertext()), naver)
        self.assertIn('1,450만 원', website['body_md'])
        self.assertIn('2,400만 원', tistory['body'])
        self.assertIn('연 180만 원', naver)
        self.assertNotRegex(naver, r'</?(?:p|h2|img|a)\b')
        tags = re.findall(r'#([^\s#]+)', naver.split('[네이버 태그]')[1])
        self.assertEqual(len(tags), 26)
        self.assertEqual(len(tags), len(set(tags)))
        self.assertEqual(naver.count('https://taxcalc.co.kr/#income/employment'), 1)

    def test_amounts_tax_boundaries_and_combined_caps(self):
        examples = self.record['examples']
        for case in examples['websitePayments'] + [examples['tistory']] + examples['naver']:
            self.assertEqual(min(case['payment'], 3000000) * 40 // 100, case['deduction'])
        for case in examples['websiteTax'] + [examples['tistory']]:
            self.assertEqual(case['beforeTaxBase'] - case['deduction'], case['afterTaxBase'])
            self.assertEqual(calculated_tax(case['beforeTaxBase']), case['beforeCalculatedIncomeTax'])
            self.assertEqual(calculated_tax(case['afterTaxBase']), case['afterCalculatedIncomeTax'])
            self.assertEqual(case['beforeCalculatedIncomeTax'] - case['afterCalculatedIncomeTax'], case['difference'])
        for case in examples['combinedCap']:
            self.assertEqual(min(case['loanDeduction'] + case['subscriptionDeduction'], 4000000), case['appliedCombined'])
            self.assertEqual(case['appliedCombined'] - case['loanDeduction'], case['additionalSubscription'])
        for person in examples['naver']:
            self.assertEqual(person['monthlyPayment'] * 12, person['payment'])
            self.assertLessEqual(person['salary'], 70000000)

    def test_legal_criteria_and_calculator_limits(self):
        for suffix in ('.md', '_티스토리.txt', '_네이버.txt'):
            text = (ROOT / 'blog_post' / (STEM + suffix)).read_text()
            self.assertIn('2026년 귀속', text)
            self.assertIn('2025년 1월 1일', text)
            self.assertIn('2월 말', text)
            self.assertNotIn('3월', text)
            for criterion in ('총급여', '세대주', '배우자', '명의', '과세연도 중', '400만 원', '2,500만 원', '5년 이내', '자동', '환급'):
                self.assertIn(criterion, text)
        self.assertFalse(self.record['calculator']['eligibilityAndCapsAutomatic'])
        self.assertFalse(self.record['calculator']['subscriptionPercentAutomatic'])
        self.assertEqual(self.record['rules']['maxDeduction'], 1200000)

    def test_site_dates_and_distinct_image_files(self):
        html = (ROOT / 'blog' / f'{SLUG}.html').read_text()
        url = f'https://taxcalc.co.kr/blog/{SLUG}.html'
        self.assertIn(f'<link rel="canonical" href="{url}"', html)
        self.assertIn(f'https://taxcalc.co.kr/thumbnails/{SLUG}.webp', html)
        self.assertIn('"datePublished": "2026-10-10"', html)
        self.assertIn('https://taxcalc.co.kr/income/employment.html', html)
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        entries = [e for e in ElementTree.parse(ROOT / 'sitemap.xml').findall('s:url', ns) if e.findtext('s:loc', namespaces=ns) == url]
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0].findtext('s:lastmod', namespaces=ns), '2026-10-10')
        hashes = set()
        for image in self.record['images']:
            data = (ROOT / image['file']).read_bytes()
            self.assertEqual(webp_size(data), tuple(image['size']))
            self.assertTrue(image['prompt'])
            hashes.add(hashlib.sha256(data).hexdigest())
        self.assertEqual(len(hashes), 3)


if __name__ == '__main__':
    unittest.main()
