from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[2]
im=Image.new('RGB',(1080,1080),'#251917')
d=ImageDraw.Draw(im)
def put(x,y,s,size,color,bold=False):
    f=ImageFont.truetype('C:/Windows/Fonts/'+('malgunbd.ttf' if bold else 'malgun.ttf'),size)
    d.text((x,y),s,font=f,fill=color)

d.rounded_rectangle((62,63,1018,1017),radius=34,outline='#6E4337',width=2)
d.rounded_rectangle((94,98,605,158),radius=20,fill='#5C3023')
put(117,108,'S&P500 ETF · 일반계좌',29,'#FFD7B7',True)
put(95,219,'250만 원',108,'#FFD470',True)
put(95,357,'전부 공제될까?',70,'#FFFFFF',True)
put(99,468,'국내 상장과 미국 상장의 세금 차이',35,'#E5C9BD')
for x,label,sub,color in [(96,'국내 상장','배당소득','#F3A369'),(560,'미국 상장','양도소득','#E5C784')]:
    d.rounded_rectangle((x,580,x+425,827),radius=24,fill='#3A2924')
    put(x+29,608,label,36,color,True)
    put(x+29,679,sub,48,'#FFFFFF',True)
put(97,893,'매매차익 기준 · 분배금과 절세계좌는 별도',29,'#D3B7AB')
put(97,947,'공제 적용 전, 상장 시장부터 확인하세요',30,'#FFD470',True)
path=ROOT/'thumbnails/sp500-etf-domestic-us-tax-tistory.webp'
im.save(path,'WEBP',quality=94)
print(path)
