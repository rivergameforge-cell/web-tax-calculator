from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'thumbnails'
OUT.mkdir(exist_ok=True)

def text(d,xy,s,size,fill,bold=False):
    font=ImageFont.truetype('C:/Windows/Fonts/'+('malgunbd.ttf' if bold else 'malgun.ttf'),size)
    d.text(xy,s,font=font,fill=fill)

im=Image.new('RGB',(1200,630),'#EEF4F7'); d=ImageDraw.Draw(im)
d.rectangle((0,0,20,630),fill='#176A86')
text(d,(70,45),'ISA · 2026년 현행 기준',25,'#176A86',True)
text(d,(70,112),'3년 경과와 만기는 다릅니다',49,'#142E3D',True)
text(d,(73,192),'만기 · 연장 · 해지 후 재가입 비교',30,'#526873')
for x,n,h,sub in [(72,'01','기존 계약','실제 만기일 확인'),(434,'02','만기 연장','기간과 자격 확인'),(796,'03','해지·재가입','세금과 새 기간 확인')]:
    d.rounded_rectangle((x,294,x+330,515),20,fill='white',outline='#CEE0E7',width=2)
    text(d,(x+24,311),n,27,'#2886A4',True)
    text(d,(x+23,367),h,34,'#183D50',True)
    text(d,(x+23,438),sub,23,'#526873')
text(d,(75,558),'의무가입기간 충족 ≠ 반드시 해지',26,'#176A86',True)
im.save(OUT/'isa-maturity-renewal-rejoin.webp','WEBP',quality=94)

# Tistory's replacement thumbnail is generated with the built-in image tool.
# Do not recreate the retired dense text-card design. See tistory-thumbnail-v2.md.

im=Image.new('RGB',(1200,720),'#FFF7ED'); d=ImageDraw.Draw(im)
d.ellipse((864,-100,1330,355),fill='#F2DEC7')
text(d,(75,62),'계좌 관리, 같이 살펴볼까요?',26,'#8B623F',True)
text(d,(75,142),'ISA 3년 채웠어요',61,'#413B31',True)
text(d,(75,233),'이제 다시 만들면 될까요?',49,'#413B31',True)
for x,h,body,col in [(80,'날짜','3년 경과일과 만기일','#E1ECDD'),(638,'선택','연장과 해지 후 재가입','#F2DFCC')]:
    d.rounded_rectangle((x,370,x+482,605),25,fill=col)
    text(d,(x+32,400),h,30,'#6C6758',True)
    text(d,(x+32,465),body,30,'#373F37',True)
    text(d,(x+32,535),'서로 나눠 확인해요',25,'#606A60')
text(d,(82,648),'원금 일부 인출과 계좌 해지도 다릅니다',27,'#6C6758')
im.save(OUT/'isa-maturity-renewal-rejoin-naver.webp','WEBP',quality=94)
print('Website and Naver thumbnails created; generate Tistory separately.')
