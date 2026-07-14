#!/usr/bin/env python3
"""
thumbnail_build.py — 블로그 글 썸네일 HTML 생성기

동작:
  blog_build.py의 POSTS 목록을 읽어, 각 글마다 thumbnails/<slug>.html 을 생성합니다.
  각 파일은 1200x630 썸네일 카드 하나를 렌더링합니다.
  브라우저로 열어 카드 영역을 스크린샷하거나, playwright로 일괄 캡처하면 PNG가 됩니다.

  thumbnails/index.html 에서 전체 목록을 미리보기 + 캡처 안내를 볼 수 있습니다.

사용법:
  python3 build/thumbnail_build.py

  (일괄 PNG 변환 — playwright 설치 시)
  npx playwright screenshot --element=".thumb" "thumbnails/<slug>.html" "thumbnails/<slug>.png"
"""

import re
import sys
from html import escape as html_escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "build"))

from blog_build import POSTS, parse_post, POST_DIR  # noqa: E402

OUT_DIR = ROOT / "thumbnails"

# 티스토리 글 썸네일 (사이트 글과 제목·각도가 달라 별도 생성)
# file=blog_post/<file>.txt, slug=출력 파일명(-tistory), category=색상 테마
# 제목은 .txt 맨 위 "<!-- 티스토리 제목 --> <!-- 실제 제목 -->" 주석에서 자동 추출
TISTORY = [
    {"file": "부동산_복비_계산방법_티스토리", "slug": "commission-calculation-method-tistory", "category": "real-estate"},
    {"file": "상속세_신고절차_티스토리", "slug": "inheritance-filing-tistory", "category": "inherit"},
    {"file": "자동차_할부금_계산방법_티스토리", "slug": "vehicle-installment-compare-tistory", "category": "loan"},
    {"file": "자동차세_미납_티스토리", "slug": "vehicle-tax-overdue-tistory", "category": "vehicle"},
    {"file": "연봉_실수령액_티스토리", "slug": "salary-take-home-tistory", "category": "labor"},
    {"file": "연봉_5천_실수령액_티스토리", "slug": "salary-50m-take-home-tistory", "category": "labor"},
    {"file": "기타소득세_8.8_강연료_원고료_상금_티스토리", "slug": "other-income-tax-8-8-guide-tistory", "category": "business"},
    {"file": "종합소득세_가산세_신고_늦으면_얼마_티스토리", "slug": "income-tax-penalty-late-filing-tistory", "category": "business"},
    {"file": "금융소득_종합과세_2천만원_초과_계산_티스토리", "slug": "financial-income-comprehensive-tax-20m-tistory", "category": "finance"},
]


def parse_tistory_title(txt_path: Path) -> str:
    """티스토리 .txt 맨 위 제목 주석에서 제목 추출."""
    raw = txt_path.read_text(encoding="utf-8")
    # <!-- 티스토리 제목 ... --> 다음의 <!-- 실제 제목 --> 추출
    m = re.search(r"티스토리 제목[^>]*-->\s*<!--\s*(.+?)\s*-->", raw, re.DOTALL)
    if m:
        return m.group(1).strip()
    return ""

# 카테고리별 색상 테마 (배경 그라데이션 + 강조색)
THEMES = {
    "real-estate": {"grad": ("#2563EB", "#1E3A8A"), "accent": "#FCD34D", "icon": "🏠", "label": "부동산"},
    "finance":     {"grad": ("#059669", "#065F46"), "accent": "#FDE047", "icon": "📈", "label": "금융"},
    "labor":       {"grad": ("#7C3AED", "#4C1D95"), "accent": "#FDE047", "icon": "💼", "label": "근로"},
    "business":    {"grad": ("#4F46E5", "#312E81"), "accent": "#FDE047", "icon": "🧾", "label": "사업 세금"},
    "inherit":     {"grad": ("#B45309", "#78350F"), "accent": "#FEF08A", "icon": "📜", "label": "상속·증여"},
    "vehicle":     {"grad": ("#DC2626", "#7F1D1D"), "accent": "#FDE047", "icon": "🚗", "label": "자동차"},
    "loan":        {"grad": ("#0891B2", "#155E75"), "accent": "#FDE047", "icon": "🏦", "label": "대출"},
    "fines":       {"grad": ("#EA580C", "#7C2D12"), "accent": "#FEF08A", "icon": "🚨", "label": "과태료"},
}
DEFAULT_THEME = {"grad": ("#2563EB", "#1E3A8A"), "accent": "#FCD34D", "icon": "📋", "label": "세금"}


def thumb_headline(title: str) -> str:
    """긴 제목을 썸네일용 후킹 문구로 축약. 첫 절(쉼표/em-dash/물음표) 기준."""
    # 끝의 (2026...) 류 괄호 제거
    t = re.sub(r"\s*\([^)]*\)\s*$", "", title).strip()
    # 따옴표 제거
    t = t.strip('"“”')
    # 첫 구분자로 자르기 (단, 너무 짧으면 두 번째 절까지)
    parts = re.split(r"\s*[—,?!]\s*", t)
    head = parts[0].strip()
    if len(head) < 12 and len(parts) > 1:
        head = (head + " " + parts[1]).strip()
    # 물음표는 후킹에 도움 → 원문에 물음표가 첫 절 끝이면 살림
    m = re.match(r"^[^?]{0,40}\?", t)
    if m and len(m.group(0)) <= 38:
        head = m.group(0).strip()
    return head


def font_size_for(text: str) -> int:
    n = len(text)
    if n <= 14:
        return 76
    if n <= 22:
        return 62
    if n <= 30:
        return 52
    if n <= 40:
        return 44
    return 38


CARD_TEMPLATE = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>{slug} thumbnail</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: 'Pretendard', -apple-system, sans-serif; background: #e5e7eb; margin: 0; padding: 0; }}
    /* 캡처용: 뷰포트 1200x630 풀스크린 스크린샷 시 카드가 정확히 꽉 참 */
    .thumb {{
      width: 1200px; height: 630px;
      background: linear-gradient(135deg, {grad0} 0%, {grad1} 100%);
      position: relative; overflow: hidden;
      display: flex; flex-direction: column; justify-content: space-between;
      padding: 72px 80px; color: white;
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
    }}
    .bg-grid {{ position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 60px 60px; }}
    .bg-circle {{ position: absolute; top: -180px; right: -160px; width: 520px; height: 520px; background: rgba(255,255,255,0.08); border-radius: 50%; }}
    .header {{ display: flex; align-items: center; gap: 18px; position: relative; z-index: 1; }}
    .logo-box {{ width: 64px; height: 64px; background: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 38px; font-weight: 900; color: {grad0}; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }}
    .brand {{ font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }}
    .brand-sub {{ font-size: 15px; opacity: 0.85; margin-top: 2px; }}
    .main {{ position: relative; z-index: 1; }}
    .cat-badge {{ display: inline-flex; align-items: center; gap: 8px; background: {accent}; color: {grad1}; font-size: 22px; font-weight: 800; padding: 8px 22px; border-radius: 999px; margin-bottom: 26px; box-shadow: 0 4px 12px rgba(0,0,0,0.18); }}
    h1 {{ font-size: {fsize}px; font-weight: 900; line-height: 1.22; letter-spacing: -1.5px; max-width: 1000px; }}
    h1 .accent {{ color: {accent}; }}
    .footer {{ display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1; }}
    .cta {{ font-size: 26px; font-weight: 700; }}
    .cta .arrow {{ color: {accent}; }}
    .url {{ font-size: 20px; opacity: 0.85; font-weight: 600; }}
  </style>
</head>
<body>
  <div class="thumb">
    <div class="bg-grid"></div>
    <div class="bg-circle"></div>

    <div class="header">
      <div class="logo-box">₩</div>
      <div>
        <div class="brand">세금계산기</div>
        <div class="brand-sub">taxcalc.co.kr · 2026년 최신 세율</div>
      </div>
    </div>

    <div class="main">
      <div class="cat-badge">{icon} {cat_label}</div>
      <h1>{headline}</h1>
    </div>

    <div class="footer">
      <div class="cta">30초 무료 계산 <span class="arrow">→</span></div>
      <div class="url">taxcalc.co.kr</div>
    </div>
  </div>
</body>
</html>
"""


INDEX_HEAD = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>블로그 썸네일 목록</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
  <style>
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{ font-family:'Pretendard',sans-serif; background:#f8f9fa; color:#1f2937; padding:32px; }}
    h1 {{ font-size:24px; margin-bottom:8px; }}
    .desc {{ color:#6b7280; font-size:14px; margin-bottom:24px; line-height:1.7; }}
    .desc code {{ background:#eef2ff; padding:2px 7px; border-radius:5px; font-size:13px; }}
    .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(380px,1fr)); gap:20px; }}
    .item {{ background:white; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }}
    .item .frame {{ width:100%; aspect-ratio:1200/630; border:0; display:block; transform-origin:top left; }}
    .item .cap {{ padding:12px 16px; font-size:13px; }}
    .item .cap b {{ display:block; color:#111827; margin-bottom:4px; font-size:13.5px; }}
    .item .cap a {{ color:#2563EB; text-decoration:none; font-size:12.5px; }}
  </style>
</head>
<body>
  <h1>📸 블로그 썸네일 목록 ({count}개)</h1>
  <div class="desc">
    각 카드를 PNG로 만드는 법:<br>
    <b>방법 1 (개별)</b> — 썸네일 HTML 파일을 브라우저로 열고 개발자도구(F12) → <code>&lt;div class="thumb"&gt;</code> 우클릭 → "Capture node screenshot"<br>
    <b>방법 2 (일괄, playwright)</b> — 터미널에서 <code>python3 build/thumbnail_build.py --shots</code> 실행하면 캡처 명령 목록을 출력합니다.<br>
    파일명은 각 글 .md의 <code>썸네일 파일명</code>과 맞추면 좋습니다.
  </div>
  <div class="grid">
"""


def render_card(meta, parsed):
    theme = THEMES.get(meta["category"], DEFAULT_THEME)
    headline = thumb_headline(parsed["title"])
    return CARD_TEMPLATE.format(
        slug=meta["slug"],
        grad0=theme["grad"][0],
        grad1=theme["grad"][1],
        accent=theme["accent"],
        icon=theme["icon"],
        cat_label=html_escape(theme["label"]),
        fsize=font_size_for(headline),
        headline=html_escape(headline),
    )


def all_slugs():
    """캡처 대상 전체 슬러그 (사이트 POSTS + 티스토리)."""
    slugs = [m["slug"] for m in POSTS]
    for t in TISTORY:
        if (POST_DIR / f"{t['file']}.txt").exists():
            slugs.append(t["slug"])
    return slugs


def generate_html(log=sys.stdout):
    """모든 썸네일 HTML(사이트+티스토리) + 미리보기 인덱스 생성."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cards = []  # (slug, title, kind)

    # 1) 사이트 글 (POSTS, .md H1 제목)
    for meta in POSTS:
        md = POST_DIR / f"{meta['file']}.md"
        if not md.exists():
            print(f"[!] 원고 누락: {md.name}", file=log)
            continue
        parsed = parse_post(md)
        html = render_card(meta, parsed)
        (OUT_DIR / f"{meta['slug']}.html").write_text(html, encoding="utf-8")
        cards.append((meta["slug"], parsed["title"], "사이트"))
        print(f"  ✓ thumbnails/{meta['slug']}.html  ({thumb_headline(parsed['title'])})", file=log)

    # 2) 티스토리 글 (TISTORY, .txt 제목 주석)
    for t in TISTORY:
        txt = POST_DIR / f"{t['file']}.txt"
        if not txt.exists():
            print(f"[!] 티스토리 원고 누락: {txt.name}", file=log)
            continue
        title = parse_tistory_title(txt)
        if not title:
            print(f"[!] 티스토리 제목 주석 없음: {txt.name}", file=log)
            continue
        meta = {"slug": t["slug"], "category": t["category"]}
        html = render_card(meta, {"title": title})
        (OUT_DIR / f"{t['slug']}.html").write_text(html, encoding="utf-8")
        cards.append((t["slug"], title, "티스토리"))
        print(f"  ✓ thumbnails/{t['slug']}.html  [티스토리] ({thumb_headline(title)})", file=log)

    # 미리보기 인덱스
    parts = [INDEX_HEAD.format(count=len(cards))]
    for slug, title, kind in cards:
        parts.append(
            f'''    <div class="item">
      <iframe class="frame" src="{slug}.html" loading="lazy" scrolling="no"></iframe>
      <div class="cap"><b>[{kind}] {html_escape(title[:55])}</b>
        <a href="{slug}.html" target="_blank">{slug}.html 열기 →</a></div>
    </div>'''
        )
    parts.append("\n  </div>\n</body>\n</html>\n")
    (OUT_DIR / "index.html").write_text("\n".join(parts), encoding="utf-8")
    print(f"▶ thumbnails/index.html 생성 — 총 {len(cards)}개", file=log)
    return cards


def main():
    if "--shots" in sys.argv:
        # HTML을 먼저 생성(로그는 stderr로 → stdout 파이프 오염 방지)
        print("# (썸네일 HTML 자동 재생성 중...)", file=sys.stderr)
        generate_html(log=sys.stderr)
        # 캡처+변환 bash 스크립트를 stdout으로 출력
        print("#!/bin/bash")
        print("# 썸네일 일괄 생성: 1200x630 PNG 캡처(playwright) → WebP 변환(Pillow) → PNG 삭제")
        print("# 사전 준비(최초 1회): npx playwright install chromium")
        print("# 실행: python3 build/thumbnail_build.py --shots | bash")
        print("set -e")
        print('DIR="$(pwd)/thumbnails"')
        for s in all_slugs():
            print(
                f'npx playwright screenshot --viewport-size=1200,630 '
                f'"file://$DIR/{s}.html" "thumbnails/{s}.png"'
            )
        # PNG → WebP 일괄 변환 (Pillow)
        print(
            "python3 -c \"from PIL import Image; import glob, os; "
            "[ (Image.open(p).save(p[:-4]+'.webp','WEBP',quality=88), os.remove(p)) "
            "for p in glob.glob('thumbnails/*.png') ]\""
        )
        print('echo \"✅ thumbnails/*.webp 생성 완료\"')
        return 0

    generate_html()
    print("▶ 완료. PNG/WebP로 만들려면: python3 build/thumbnail_build.py --shots | bash")
    return 0


if __name__ == "__main__":
    sys.exit(main())
