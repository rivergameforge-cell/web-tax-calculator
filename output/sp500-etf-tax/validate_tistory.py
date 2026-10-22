import html, json, re, sys
from decimal import Decimal
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'build'))
from tistory_prepare import parse_tistory_post
stem='S&P500_ETF_국내상장_미국상장_세금_비교_티스토리'
post=parse_tistory_post(ROOT/'blog_post'/f'{stem}.txt')
body=post['body']
visible=html.unescape(re.sub('<[^>]+>',' ',body))
assert not re.search(r'\d만[원]',visible)
assert len(re.findall(r'<ins\b',body))==2
assert len(re.findall(r'<h2\b[^>]*>.*?</h2>\s*<center><ins\b',body,re.S))==2
assert body.index('<p ') < body.index('<img ') < body.index('<h2 ')
assert re.findall(r'<h2\b[^>]*>(.*?)</h2>',body)[-1]=='함께 읽으면 좋은 글'
assert len(re.findall(r'>&nbsp;</p>',body))>=25
footer=body.split('함께 읽으면 좋은 글</h2>')[1]
urls=re.findall(r'https://[^<\s]+',footer)
assert len(urls)==2 and all(u.startswith('https://kwonriver-carstroy.tistory.com/entry/') for u in urls)
assert Image.open(ROOT/'thumbnails/sp500-etf-domestic-us-tax-tistory.webp').size==(1080,1080)
checks={
 'domestic_gain_2m':Decimal(2000000)*Decimal('.154'),
 'tax_base_1_2m':Decimal(1200000)*Decimal('.154'),
 'domestic_gain_6m_loss_5m':Decimal(6000000)*Decimal('.154'),
 'us_gain_6m_loss_5m':max(6000000-5000000-2500000,0)*Decimal('.22'),
 'domestic_only_gain_8m':Decimal(8000000)*Decimal('.154'),
 'us_only_gain_8m':Decimal(8000000-2500000)*Decimal('.22'),
}
assert list(checks.values())==list(map(Decimal,[308000,184800,924000,0,1232000,1210000]))
result={'title':post['title'],'checked':'2026-10-23','ads':2,'adPlacement':'heading -> ad -> section text','imageSize':[1080,1080],'imagePlacement':'introduction -> image -> first heading','related':urls,'nativeCards':'to be verified in editor and published page','calculations':{k:str(v) for k,v in checks.items()},'amountSpacing':True}
(ROOT/'output/sp500-etf-tax/tistory-content-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(result,ensure_ascii=False))
