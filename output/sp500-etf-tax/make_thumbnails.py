from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'thumbnails'
FONTS = Path('C:/Windows/Fonts')

def font(size, bold=False):
    return ImageFont.truetype(str(FONTS / ('malgunbd.ttf' if bold else 'malgun.ttf')), size)

def text(d, xy, s, size, color, bold=False):
    d.text(xy, s, font=font(size, bold), fill=color)

def pill(d, box, label, bg, fg, size=23):
    d.rounded_rectangle(box, radius=18, fill=bg)
    text(d, (box[0]+20, box[1]+10), label, size, fg, True)

im = Image.new('RGB', (1200,630), '#101F35')
d=ImageDraw.Draw(im)
for x in range(0,1200,60): d.line((x,0,x,630),fill='#192B43')
for y in range(0,630,60): d.line((0,y,1200,y),fill='#192B43')
pill(d,(64,44,346,102),'2026 · 일반계좌 기준','#243B56','#C5E1FF')
text(d,(64,125),'S&P500 ETF 세금 비교',52,'#FFFFFF',True)
text(d,(67,201),'같은 지수여도, 상장 시장이 다르면',28,'#CAD6E5')
for x,label,kind,sub,accent in [
    (64,'국내 상장','배당소득','과표 증분 · 원천징수','#7FE6C6'),
    (618,'미국 상장','양도소득','연간 손익 · 250만 원 공제','#A4C9FF')]:
    d.rounded_rectangle((x,283,x+518,520),radius=24,fill='#20344E',outline='#3C526E',width=2)
    text(d,(x+30,306),label,27,accent,True)
    text(d,(x+30,359),kind,45,'#FFFFFF',True)
    text(d,(x+30,438),sub,25,'#DCE4EF')
text(d,(66,558),'매매차익 기준 · ISA·연금계좌는 별도',23,'#AEBED1')
text(d,(971,558),'TaxCalc',25,'#FFFFFF',True)
im.save(OUT/'sp500-etf-domestic-us-tax.webp','WEBP',quality=94)

im = Image.new('RGB',(1200,720),'#F7F1E8')
d=ImageDraw.Draw(im)
d.rounded_rectangle((60,55,356,105),radius=24,fill='#D9E9DD')
text(d,(82,63),'ETF 세금, 같이 볼까요?',22,'#244D3C',True)
text(d,(70,140),'같은 S&P500인데',56,'#223C35',True)
text(d,(70,221),'세금은 왜 다를까요?',56,'#223C35',True)
for x,label,big,small,bg,accent in [
    (74,'국내 상장 ETF','배당소득','250만 원 공제 적용 안 됨','#E2EBDD','#3C654C'),
    (631,'미국 상장 ETF','양도소득','연간 손익 합산 후 기본공제','#DDE7F2','#355D82')]:
    d.rounded_rectangle((x+7,346,x+506,596),radius=26,fill='#E3DDD4')
    d.rounded_rectangle((x,335,x+499,585),radius=26,fill='#FFFFFF')
    d.rounded_rectangle((x+22,356,x+477,405),radius=13,fill=bg)
    text(d,(x+40,362),label,25,accent,True)
    text(d,(x+34,429),big,44,accent,True)
    text(d,(x+34,514),small,23,'#4F5C58')
text(d,(78,639),'일반계좌의 매매차익 기준 · 분배금은 별도 확인',25,'#67776E')
im.save(OUT/'sp500-etf-domestic-us-tax-naver.webp','WEBP',quality=94)
print('Created website 1200x630 and Naver 1200x720 thumbnails')
