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

STEM = '부모님_인적공제_국민연금_소득100만원_계산'
SLUG = 'parent-dependent-deduction-pension'


class ParentPostTests(unittest.TestCase):
    def test_tistory_structure_and_package(self):
        post = tistory_prepare.parse_tistory_post(ROOT / 'blog_post' / f'{STEM}_티스토리.txt')
        article = ElementTree.fromstring('<article>' + post['body'].replace('&nbsp;', '&#160;') + '</article>')
        nodes = list(article)
        blank = lambda n: n.tag == 'p' and not list(n) and not (n.text or '').strip()
        image = next(i for i, n in enumerate(nodes) if n.find('img') is not None)
        heading = next(i for i, n in enumerate(nodes) if n.tag == 'h2')
        self.assertGreater(image, 0)
        self.assertLess(image, heading)
        self.assertTrue(all(n.tag == 'p' for n in nodes[:image]))
        self.assertEqual([n.get('data-ke-size') for n in nodes if n.tag == 'p'], ['size16'] * sum(n.tag == 'p' for n in nodes))
        ads = [i for i, n in enumerate(nodes) if n.tag == 'center' and n.find('ins') is not None]
        self.assertEqual(len(ads), 2)
        for i in ads:
            self.assertEqual(nodes[i - 1].tag, 'h2')
            self.assertEqual(nodes[i + 1].tag, 'p')
            self.assertFalse(blank(nodes[i + 1]))
        self.assertFalse(any(blank(a) and blank(b) for a, b in zip(nodes, nodes[1:])))
        self.assertNotIn('공식 자료</h2>', post['body'])
        self.assertIn('함께 읽으면 좋은 글</h2>', post['body'])
        self.assertEqual(post['body'], (ROOT / 'tistory_upload' / SLUG / 'body.html').read_text().strip())
        helper = (ROOT / 'tistory_upload' / SLUG / 'upload-helper.html').read_text()
        self.assertIn('서론 다음, 첫 소제목 앞', helper)

    def test_differentiation_and_naver_tags(self):
        website = blog_build.parse_post(ROOT / 'blog_post' / f'{STEM}.md')
        tistory = tistory_prepare.parse_tistory_post(ROOT / 'blog_post' / f'{STEM}_티스토리.txt')
        naver = (ROOT / 'blog_post' / f'{STEM}_네이버.txt').read_text()
        candidates = naver.split('[본문]')[0]
        self.assertEqual(len(re.findall(r'^\d\. ', candidates, re.MULTILINE)), 3)
        title = naver.split('[본문]\n')[1].splitlines()[0]
        self.assertEqual(len({website['title'], tistory['title'], title}), 3)
        self.assertNotRegex(naver, r'</?(?:p|h2|img|a)\b')
        tags = re.findall(r'#([^\s#]+)', naver.split('[네이버 태그]')[1])
        self.assertGreaterEqual(len(tags), 20)
        self.assertLessEqual(len(tags), 30)
        self.assertEqual(len(tags), len(set(tags)))
        opening = ElementTree.fromstring('<article>' + tistory['body'].replace('&nbsp;', '&#160;') + '</article>')[0].text
        self.assertNotIn(opening, website['body_md'])
        self.assertNotIn(opening, naver)
        self.assertIn('500만 원', website['body_md'])
        self.assertIn('840만 원', tistory['body'])
        self.assertIn('72세', naver)

    def test_recorded_calculations(self):
        record = json.loads((ROOT / 'blog_post' / f'{SLUG}.production.json').read_text())
        cases = record['examples']['website'] + [record['examples']['tistory'], record['examples']['naver']]
        for case in cases:
            taxable = case['taxablePension']
            deduction = 3500000 + (taxable - 3500000) * 0.4
            self.assertEqual(deduction, case['pensionDeduction'])
            self.assertEqual(taxable - deduction, case['pensionIncome'])
        effect = record['examples']['taxEffect']
        self.assertEqual(effect['taxBaseBefore'] * 0.15 - 1260000, effect['taxBefore'])
        self.assertEqual(effect['taxBaseAfter'] * 0.15 - 1260000, effect['taxAfter'])
        self.assertEqual(effect['taxBefore'] - effect['taxAfter'], effect['difference'])
        naver = record['examples']['naver']
        self.assertEqual(naver['basicDeduction'] + naver['elderlyDeduction'], naver['totalDeduction'])


if __name__ == '__main__':
    unittest.main()
