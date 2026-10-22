import json, re, sys, hashlib
from pathlib import Path
from decimal import Decimal
from PIL import Image
from html.parser import HTMLParser

class Document(HTMLParser):
    def __init__(self, raw):
        super().__init__()
        self.h1=0; self.h2=[]; self.text=[]; self.canonical=''; self.related=[]; self.schemas=[]
        self.in_h2=False; self.in_related=False; self.script=None
        self.feed(raw)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='h1': self.h1+=1
        if tag=='h2': self.in_h2=True; self.h2.append('')
        if tag=='div' and 'related-articles' in a.get('class',''): self.in_related=True
        if tag=='a' and self.in_related: self.related.append(a['href'])
        if tag=='link' and a.get('rel')=='canonical': self.canonical=a['href']
        if tag=='script' and a.get('type')=='application/ld+json': self.script=''
    def handle_data(self,data):
        self.text.append(data)
        if self.in_h2: self.h2[-1]+=data
        if self.script is not None: self.script+=data
    def handle_endtag(self,tag):
        if tag=='h2': self.in_h2=False
        if tag=='div': self.in_related=False
        if tag=='script' and self.script is not None:
            self.schemas.append(json.loads(self.script)); self.script=None

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'build'))
import build

slug='sp500-etf-domestic-us-tax'
stem='S&P500_ETF_국내상장_미국상장_세금_비교'
page=ROOT/'blog'/f'{slug}.html'
raw=page.read_text(encoding='utf-8')
soup=Document(raw)
md=(ROOT/'blog_post'/f'{stem}.md').read_text(encoding='utf-8')
nav=(ROOT/'blog_post'/f'{stem}_네이버.txt').read_text(encoding='utf-8')
for text in (md,nav,''.join(soup.text)):
    assert not re.search(r'\d만[원]',text), '금액 띄어쓰기'
assert soup.h1==1
assert soup.h2[-1]=='함께 읽으면 좋은 글'
related=soup.related
assert len(related)==2
for a in related:
    assert a.startswith('/blog/')
    assert (ROOT/a.lstrip('/')).is_file()
assert len(set(re.findall(r'#[^\s]+',nav.split('[네이버 태그]')[1])))==25
assert md.splitlines()[0].lstrip('# ') not in nav
assert soup.canonical==f'https://taxcalc.co.kr/blog/{slug}.html'
assert len(soup.schemas)>=2
assert Image.open(ROOT/'thumbnails'/f'{slug}.webp').size==(1200,630)
assert Image.open(ROOT/'thumbnails'/f'{slug}-naver.webp').size==(1200,720)
checks={
 'site_tax_base':Decimal(2000000)*Decimal('.154'),
 'site_loss_case_domestic':Decimal(5000000)*Decimal('.154'),
 'site_loss_case_us':max(5000000-3000000-2500000,0)*Decimal('.22'),
 'site_only_gain_domestic':Decimal(10000000)*Decimal('.154'),
 'site_only_gain_us':Decimal(10000000-2500000)*Decimal('.22'),
 'naver_tax_base':Decimal(1000000)*Decimal('.154'),
 'naver_loss_case_domestic':Decimal(4000000)*Decimal('.154'),
 'naver_loss_case_us':max(4000000-2500000-2500000,0)*Decimal('.22'),
}
assert list(checks.values())==list(map(Decimal,[308000,770000,0,1540000,1650000,154000,616000,0]))

# Keep the calculator dates/signatures intact while adding the new article to the sitemap.
key=page.relative_to(ROOT).as_posix()
build.DATES[key]={'published':'2026-10-22','modified':'2026-10-22','digest':hashlib.sha256(raw.encode()).hexdigest()}
pages=build.load_all_content()
for p in pages.values(): p['_modified']=build.DATES[f"{p['id']}.html"]['modified']
build.build_sitemap(pages)
build.DATES_PATH.write_text(json.dumps(build.DATES,ensure_ascii=False,indent=2,sort_keys=True)+'\n',encoding='utf-8',newline='\n')
result={'article':slug,'calculations':{k:str(v) for k,v in checks.items()},'relatedPosts':related,'tags':25,'amountSpacing':True,'thumbnails':[[1200,630],[1200,720]],'structuredData':True}
(ROOT/'output/sp500-etf-tax/content-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(result,ensure_ascii=False))
