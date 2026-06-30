#!/usr/bin/env python3
"""
blog_build.py — 블로그 정적 페이지 빌더

동작:
  blog_post/*.md 원고를 읽어 blog/<slug>.html 로 변환하고,
  blog/index.html(목록)을 자동 재생성합니다.

  slug, category, CTA 등 매핑은 아래 POSTS 딕셔너리에서 관리합니다.
  customHtml=True 인 글은 HTML을 덮어쓰지 않고 목록에만 등록됩니다.

사용법:
  python3 build/blog_build.py
"""

import re
import sys
from html import escape as html_escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POST_DIR = ROOT / "blog_post"
OUT_DIR = ROOT / "blog"
INDEX_PATH = OUT_DIR / "index.html"

# ---------------------------------------------------------------------------
# 글 매핑 — 새 .md 추가 시 여기에만 항목 추가하면 됨
# ---------------------------------------------------------------------------

POSTS = [
    # (file_stem, slug, category_id, category_label, date, read_min, cta_href, cta_label, related[], customHtml)
    {
        "file": "퇴직금_계산기_블로그_포스팅",
        "slug": "severance-pay-guide",
        "category": "labor",
        "categoryLabel": "근로 세금",
        "date": "2026-05-05",
        "readMin": 5,
        "customHtml": True,
    },
    {
        "file": "이자_배당소득세_절세팁",
        "slug": "dividend-tax-saving",
        "category": "finance",
        "categoryLabel": "금융 세금",
        "date": "2026-05-05",
        "readMin": 5,
        "customHtml": True,
    },
    {
        "file": "오피스텔_취득세_블로그_포스팅",
        "slug": "officetel-acquisition",
        "category": "real-estate",
        "categoryLabel": "부동산 세금",
        "date": "2026-05-05",
        "readMin": 4,
        "customHtml": True,
    },
    # --- 사용자 직접 작성 글 (HTML 수기 작성 → customHtml=True, 인덱스에만 등록) ---
    {
        "file": "상속_증여세_비교_블로그_포스팅",
        "slug": "gift-vs-inheritance-tax",
        "category": "inherit",
        "categoryLabel": "상속·증여",
        "date": "2026-05-20",
        "readMin": 5,
        "customHtml": True,
    },
    {
        "file": "상속세_계산_절세팁_블로그_포스팅",
        "slug": "inheritance-tax-guide",
        "category": "inherit",
        "categoryLabel": "상속·증여",
        "date": "2026-05-20",
        "readMin": 5,
        "customHtml": True,
    },
    {
        "file": "상속세_과세대상_범위",
        "slug": "inheritance-taxable-scope",
        "category": "inherit",
        "categoryLabel": "상속·증여",
        "date": "2026-06-16",
        "readMin": 5,
        "ctaHref": "/inherit/inheritance.html",
        "ctaLabel": "상속세 계산기",
        "related": [
            ("/inherit/inheritance.html", "상속세 계산기"),
            ("/inherit/gift.html", "증여세 계산기"),
            ("/real-estate/acquisition.html", "취득세 계산기"),
            ("/real-estate/capital-gains.html", "양도소득세 계산기"),
        ],
        "customHtml": False,
    },
    {
        "file": "4대보험_알아보기_블로그_포스팅",
        "slug": "four-major-insurance-guide",
        "category": "labor",
        "categoryLabel": "근로 세금",
        "date": "2026-05-22",
        "readMin": 5,
        "customHtml": True,
    },
    {
        "file": "사회초년생_월세_세액공제_블로그_포스팅",
        "slug": "monthly-rent-tax-credit",
        "category": "labor",
        "categoryLabel": "근로 세금",
        "date": "2026-05-28",
        "readMin": 4,
        "customHtml": True,
    },
    {
        "file": "사회초년생_연금저축_IRP_블로그_포스팅",
        "slug": "pension-saving-irp-credit",
        "category": "finance",
        "categoryLabel": "금융 세금",
        "date": "2026-05-31",
        "readMin": 4,
        "customHtml": True,
    },
    {
        "file": "사회초년생_IRP_이유_블로그_포스팅",
        "slug": "irp-why-start-young",
        "category": "finance",
        "categoryLabel": "금융 세금",
        "date": "2026-06-09",
        "readMin": 4,
        "customHtml": True,
    },
    {
        "file": "부동산_복비_블로그_포스팅",
        "slug": "real-estate-commission",
        "category": "real-estate",
        "categoryLabel": "부동산 세금",
        "date": "2026-05-12",
        "readMin": 4,
        "ctaHref": "/real-estate/commission.html",
        "ctaLabel": "부동산 중개수수료 계산기",
        "related": [
            ("/real-estate/commission.html", "부동산 중개수수료 계산기"),
            ("/real-estate/acquisition.html", "취득세 계산기"),
            ("/real-estate/total-cost.html", "부동산 매매 총비용 계산기"),
            ("/real-estate/stamp.html", "인지세 계산기"),
        ],
        "customHtml": False,
    },
    {
        "file": "부동산_복비_계산방법",
        "slug": "commission-calculation-method",
        "category": "real-estate",
        "categoryLabel": "부동산 세금",
        "date": "2026-06-16",
        "readMin": 5,
        "ctaHref": "/real-estate/commission.html",
        "ctaLabel": "부동산 중개수수료 계산기",
        "related": [
            ("/real-estate/commission.html", "부동산 중개수수료 계산기"),
            ("/real-estate/total-cost.html", "부동산 매매 총비용 계산기"),
            ("/real-estate/acquisition.html", "취득세 계산기"),
            ("/real-estate/officetel-acquisition.html", "오피스텔 취득세 계산기"),
        ],
        "customHtml": False,
    },
    {
        "file": "연봉_5천_실수령액",
        "slug": "salary-50m-take-home",
        "category": "labor",
        "categoryLabel": "근로 세금",
        "date": "2026-06-24",
        "readMin": 5,
        "ctaHref": "/income/salary.html",
        "ctaLabel": "연봉 실수령액 계산기",
        "related": [
            ("/income/salary.html", "연봉 실수령액 계산기"),
            ("/income/insurance.html", "4대보험 계산기"),
            ("/income/pension-saving.html", "연금저축 세액공제 계산기"),
            ("/income/rent-credit.html", "월세 세액공제 계산기"),
        ],
        "customHtml": False,
    },
    {
        "file": "연봉_실수령액",
        "slug": "salary-take-home",
        "category": "labor",
        "categoryLabel": "근로 세금",
        "date": "2026-06-23",
        "readMin": 5,
        "ctaHref": "/income/salary.html",
        "ctaLabel": "연봉 실수령액 계산기",
        "related": [
            ("/income/salary.html", "연봉 실수령액 계산기"),
            ("/income/insurance.html", "4대보험 계산기"),
            ("/income/comprehensive.html", "종합소득세 계산기"),
            ("/income/severance.html", "퇴직금 계산기"),
        ],
        "customHtml": False,
    },
    {
        "file": "자동차세_미납",
        "slug": "vehicle-tax-overdue",
        "category": "vehicle",
        "categoryLabel": "자동차",
        "date": "2026-06-22",
        "readMin": 5,
        "ctaHref": "/vehicle/overdue.html",
        "ctaLabel": "자동차세 체납 가산금 계산기",
        "related": [
            ("/vehicle/overdue.html", "자동차세 체납 가산금 계산기"),
            ("/vehicle/vehicle-tax.html", "자동차세 계산기"),
            ("/vehicle/acquisition.html", "자동차 취득세 계산기"),
            ("/fines/traffic.html", "교통 과태료 계산기"),
        ],
        "customHtml": False,
    },
    {
        "file": "속도위반_과태료_블로그_포스팅",
        "slug": "speeding-fine-guide",
        "category": "fines",
        "categoryLabel": "과태료",
        "date": "2026-05-12",
        "readMin": 4,
        "ctaHref": "/fines/traffic.html",
        "ctaLabel": "교통 과태료 계산기",
        "related": [
            ("/fines/traffic.html", "교통 과태료 계산기"),
            ("/fines/parking.html", "주정차 위반 과태료 계산기"),
            ("/fines/living.html", "생활 과태료 계산기"),
        ],
        "customHtml": False,
    },
    {
        "file": "자동차_취득세_블로그_포스팅",
        "slug": "vehicle-acquisition-tax-guide",
        "category": "vehicle",
        "categoryLabel": "자동차",
        "date": "2026-05-12",
        "readMin": 4,
        "ctaHref": "/vehicle/acquisition.html",
        "ctaLabel": "자동차 취득세 계산기",
        "related": [
            ("/vehicle/acquisition.html", "자동차 취득세 계산기"),
            ("/vehicle/buying.html", "자동차 구매 총비용 계산기"),
            ("/vehicle/vehicle-tax.html", "자동차세 계산기"),
            ("/vehicle/excise.html", "개별소비세 계산기"),
        ],
        "customHtml": False,
    },
    {
        "file": "자동차_할부금_계산방법",
        "slug": "vehicle-installment-calculation",
        "category": "loan",
        "categoryLabel": "대출",
        "date": "2026-06-21",
        "readMin": 5,
        "ctaHref": "/vehicle/installment.html",
        "ctaLabel": "자동차 할부금 계산기",
        "related": [
            ("/vehicle/installment.html", "자동차 할부금 계산기"),
            ("/vehicle/buying.html", "자동차 구매 총비용 계산기"),
            ("/vehicle/acquisition.html", "자동차 취득세 계산기"),
            ("/loan/calculator.html", "대출금 계산기"),
        ],
        "customHtml": False,
    },
    {
        "file": "자동차_할부금_블로그_포스팅",
        "slug": "vehicle-installment-guide",
        "category": "loan",
        "categoryLabel": "대출",
        "date": "2026-05-12",
        "readMin": 4,
        "ctaHref": "/vehicle/installment.html",
        "ctaLabel": "자동차 할부금 계산기",
        "related": [
            ("/vehicle/installment.html", "자동차 할부금 계산기"),
            ("/vehicle/buying.html", "자동차 구매 총비용 계산기"),
            ("/loan/calculator.html", "대출금 계산기"),
        ],
        "customHtml": False,
    },
    {
        "file": "재산세_계산_블로그_포스팅",
        "slug": "property-tax-guide",
        "category": "real-estate",
        "categoryLabel": "부동산 세금",
        "date": "2026-05-12",
        "readMin": 5,
        "ctaHref": "/real-estate/property-tax.html",
        "ctaLabel": "재산세 계산기",
        "related": [
            ("/real-estate/property-tax.html", "재산세 계산기"),
            ("/real-estate/comprehensive.html", "종합부동산세 계산기"),
            ("/real-estate/acquisition.html", "취득세 계산기"),
        ],
        "customHtml": False,
    },
    {
        "file": "주식_배당소득세_블로그_포스팅",
        "slug": "stock-dividend-tax-guide",
        "category": "finance",
        "categoryLabel": "금융 세금",
        "date": "2026-05-12",
        "readMin": 4,
        "ctaHref": "/stocks/dividend.html",
        "ctaLabel": "배당소득세 계산기",
        "related": [
            ("/stocks/dividend.html", "배당소득세 계산기"),
            ("/income/interest-dividend.html", "이자·배당소득세 계산기"),
            ("/income/comprehensive.html", "종합소득세 계산기"),
            ("/stocks/foreign.html", "해외주식 양도소득세 계산기"),
        ],
        "customHtml": False,
    },
    {
        "file": "주정차_위반_과태료_블로그_포스팅",
        "slug": "parking-violation-fine",
        "category": "fines",
        "categoryLabel": "과태료",
        "date": "2026-05-12",
        "readMin": 4,
        "ctaHref": "/fines/parking.html",
        "ctaLabel": "주정차 위반 과태료 계산기",
        "related": [
            ("/fines/parking.html", "주정차 위반 과태료 계산기"),
            ("/fines/traffic.html", "교통 과태료 계산기"),
            ("/fines/living.html", "생활 과태료 계산기"),
        ],
        "customHtml": False,
    },
    {
        "file": "투기과열지구_대출계산_블로그_포스팅",
        "slug": "speculative-zone-ltv",
        "category": "loan",
        "categoryLabel": "대출",
        "date": "2026-05-12",
        "readMin": 4,
        "ctaHref": "/loan/ltv.html",
        "ctaLabel": "LTV 계산기",
        "related": [
            ("/loan/ltv.html", "LTV 계산기"),
            ("/loan/dsr.html", "DSR 계산기"),
            ("/loan/calculator.html", "대출금 계산기"),
        ],
        "customHtml": False,
    },
]

# ---------------------------------------------------------------------------
# 마크다운 → HTML 변환 (단순 패턴 기반)
# ---------------------------------------------------------------------------

INLINE_BOLD_RE = re.compile(r"\*\*(.+?)\*\*")
INLINE_LINK_RE = re.compile(r"\[(.+?)\]\((.+?)\)")
INLINE_CODE_RE = re.compile(r"`([^`]+?)`")


def inline_format(s: str) -> str:
    """인라인 마크다운 (볼드/링크/코드) 변환. 텍스트는 이미 escape 된 상태로 들어옴."""
    # 코드부터(다른 변환이 코드 안 내용을 건드리지 않도록)
    s = INLINE_CODE_RE.sub(r"<code>\1</code>", s)
    s = INLINE_BOLD_RE.sub(r"<strong>\1</strong>", s)
    s = INLINE_LINK_RE.sub(r'<a href="\2">\1</a>', s)
    return s


def md_to_html(md: str) -> str:
    """문단 단위로 마크다운을 HTML 로 변환."""
    lines = md.split("\n")
    out = []
    i = 0
    in_list = False
    para_buf = []

    def flush_para():
        nonlocal para_buf
        if para_buf:
            text = " ".join(line.strip() for line in para_buf if line.strip())
            if text:
                out.append(f"<p>{inline_format(html_escape(text))}</p>")
            para_buf = []

    def close_list():
        nonlocal in_list
        if in_list:
            out.append("</ul>")
            in_list = False

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # 수평선
        if stripped == "---":
            flush_para()
            close_list()
            i += 1
            continue

        # 빈 줄
        if not stripped:
            flush_para()
            close_list()
            i += 1
            continue

        # H1, H2, H3
        h_match = re.match(r"^(#{1,3})\s+(.*)$", stripped)
        if h_match:
            flush_para()
            close_list()
            level = len(h_match.group(1))
            text = inline_format(html_escape(h_match.group(2).strip().rstrip("#").strip()))
            out.append(f"<h{level}>{text}</h{level}>")
            i += 1
            continue

        # 인용 (BlockQuote)
        if stripped.startswith("> "):
            flush_para()
            close_list()
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith("> "):
                quote_lines.append(lines[i].strip()[2:])
                i += 1
            qtext = " ".join(quote_lines).strip()
            out.append(f'<blockquote class="quote">{inline_format(html_escape(qtext))}</blockquote>')
            continue

        # 리스트 (- )
        if stripped.startswith("- "):
            flush_para()
            if not in_list:
                out.append("<ul>")
                in_list = True
            item_text = inline_format(html_escape(stripped[2:].strip()))
            out.append(f"<li>{item_text}</li>")
            i += 1
            continue

        # 일반 문단
        para_buf.append(line)
        i += 1

    flush_para()
    close_list()
    return "\n".join(out)


# ---------------------------------------------------------------------------
# 원고 파싱
# ---------------------------------------------------------------------------

THUMB_RE = re.compile(r"^`(thumbnail_[a-z0-9_]+\.png)`\s*$", re.MULTILINE)
THUMB_ALT_RE = re.compile(r"^\*\*썸네일 alt\*\*\s*:\s*(.+?)$", re.MULTILINE)
HASHTAG_RE = re.compile(r"^\*\*해시태그\*\*\s*:\s*(.+?)$", re.MULTILINE)
META_DESC_RE = re.compile(r"^\*\*메타 디스크립션\*\*\s*:\s*(.+?)$", re.MULTILINE)
BLOCKQUOTE_DESC_RE = re.compile(r"^>\s+(.+?)$", re.MULTILINE)


def parse_post(md_path: Path) -> dict:
    """원고에서 제목·요약·해시태그 등을 추출 + 본문 마크다운 반환."""
    raw = md_path.read_text(encoding="utf-8")

    # 제목: 첫 # 줄
    title_match = re.search(r"^#\s+(.+?)$", raw, re.MULTILINE)
    if not title_match:
        raise ValueError(f"{md_path.name}: H1 제목 없음")
    title = title_match.group(1).strip()

    # 메타 디스크립션
    desc = ""
    m = META_DESC_RE.search(raw)
    if m:
        desc = m.group(1).strip()
    else:
        # blockquote 형식도 허용
        m = BLOCKQUOTE_DESC_RE.search(raw)
        if m:
            desc = m.group(1).strip()

    # 썸네일
    thumb = ""
    m = THUMB_RE.search(raw)
    if m:
        thumb = m.group(1).strip()

    thumb_alt = ""
    m = THUMB_ALT_RE.search(raw)
    if m:
        thumb_alt = m.group(1).strip()

    # 해시태그
    hashtags = []
    m = HASHTAG_RE.search(raw)
    if m:
        hashtags = [
            t.strip().lstrip("#")
            for t in re.split(r"\s+", m.group(1).strip())
            if t.strip().lstrip("#")
        ]

    # 본문 추출: 제목 이후 + 메타·썸네일·해시태그 라인 제거
    body = raw.split(title_match.group(0), 1)[1]
    # 메타 라인 제거
    body = META_DESC_RE.sub("", body)
    body = re.sub(r"^`thumbnail_[a-z0-9_]+\.png`\s*$", "", body, flags=re.MULTILINE)
    body = re.sub(r"^\*\*썸네일 alt\*\*\s*:.+?$", "", body, flags=re.MULTILINE)
    body = re.sub(r"^\*\*해시태그\*\*\s*:.+?$", "", body, flags=re.MULTILINE)
    # 첫 blockquote(메타 디스크립션 자리)는 한 번만 제거
    body = re.sub(r"^>\s+.+?\n", "", body, count=1, flags=re.MULTILINE)

    # 첫 H1 이후 본문에서 첫 --- 구분선까지가 메타 영역이면 제거하는 경우가 있어 안전하게 제거 한 번
    # (현재 구조에서 첫 --- 다음이 실제 본문)
    body = body.strip()

    return {
        "title": title,
        "description": desc,
        "thumbnail": thumb,
        "thumbnail_alt": thumb_alt,
        "hashtags": hashtags,
        "body_md": body,
    }


def make_excerpt(desc: str, max_len: int = 160) -> str:
    """카드용 요약. description 활용."""
    if len(desc) <= max_len:
        return desc
    return desc[: max_len - 1].rstrip() + "…"


# ---------------------------------------------------------------------------
# 페이지 렌더링
# ---------------------------------------------------------------------------

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{description}">
  <meta name="keywords" content="{keywords}">
  <meta name="author" content="세금계산기">
  <meta name="theme-color" content="#2563EB">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="googlebot" content="index, follow">
  <meta name="google-adsense-account" content="ca-pub-2792604427181547">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2792604427181547" crossorigin="anonymous"></script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/og-image.png">
  <link rel="canonical" href="https://taxcalc.co.kr/blog/{slug}.html">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="세금계산기">
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="https://taxcalc.co.kr/blog/{slug}.html">
  <meta property="og:image" content="https://taxcalc.co.kr/thumbnails/{slug}.webp">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="ko_KR">
  <meta property="article:published_time" content="{date}">
  <meta property="article:modified_time" content="{date}">
  <meta property="article:section" content="{category_label}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{og_title}">
  <meta name="twitter:description" content="{description}">
  <meta name="twitter:image" content="https://taxcalc.co.kr/thumbnails/{slug}.webp">

  <title>{title} | 세금계산기 블로그</title>

  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">

  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": {headline_json},
    "description": {description_json},
    "image": "https://taxcalc.co.kr/thumbnails/{slug}.webp",
    "author": {{ "@type": "Organization", "name": "세금계산기", "url": "https://taxcalc.co.kr/" }},
    "publisher": {{
      "@type": "Organization",
      "name": "세금계산기",
      "logo": {{ "@type": "ImageObject", "url": "https://taxcalc.co.kr/og-image.png" }}
    }},
    "datePublished": "{date}",
    "dateModified": "{date}",
    "mainEntityOfPage": "https://taxcalc.co.kr/blog/{slug}.html",
    "articleSection": {category_label_json},
    "inLanguage": "ko"
  }}
  </script>

  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {{ "@type": "ListItem", "position": 1, "name": "세금계산기", "item": "https://taxcalc.co.kr/" }},
      {{ "@type": "ListItem", "position": 2, "name": "블로그", "item": "https://taxcalc.co.kr/blog/" }},
      {{ "@type": "ListItem", "position": 3, "name": {title_json}, "item": "https://taxcalc.co.kr/blog/{slug}.html" }}
    ]
  }}
  </script>

  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: 'Pretendard', -apple-system, sans-serif; background: #f8f9fa; color: #1f2937; line-height: 1.85; }}
    .top-bar {{ background: #2563EB; padding: 14px 24px; display: flex; align-items: center; gap: 12px; }}
    .top-bar a {{ color: white; text-decoration: none; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px; }}
    .top-bar .logo-mark {{ width: 34px; height: 34px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: #2563EB; }}
    .breadcrumb {{ background: #eef2ff; padding: 10px 24px; font-size: 13px; color: #4338ca; }}
    .breadcrumb a {{ color: #4338ca; text-decoration: none; }}
    .breadcrumb a:hover {{ text-decoration: underline; }}
    .container {{ max-width: 760px; margin: 0 auto; padding: 36px 20px 80px; }}
    .meta-line {{ display: flex; gap: 14px; align-items: center; flex-wrap: wrap; font-size: 13px; color: #6b7280; margin-bottom: 14px; }}
    .meta-line .tag {{ background: #eef2ff; color: #4338ca; padding: 3px 10px; border-radius: 6px; font-weight: 600; }}
    article h1 {{ font-size: 28px; font-weight: 800; color: #111827; margin: 0 0 14px; letter-spacing: -0.5px; line-height: 1.4; }}
    .lead {{ font-size: 17px; color: #4b5563; margin: 0 0 28px; padding: 18px 22px; background: white; border-left: 4px solid #2563EB; border-radius: 0 10px 10px 0; }}
    article h2 {{ font-size: 22px; font-weight: 700; color: #1e40af; margin: 44px 0 14px; padding-bottom: 10px; border-bottom: 2px solid #dbeafe; line-height: 1.4; }}
    article h3 {{ font-size: 17px; font-weight: 700; color: #1f2937; margin: 24px 0 10px; }}
    article p {{ margin-bottom: 16px; font-size: 16px; }}
    article ul {{ margin: 10px 0 20px 22px; font-size: 15.5px; }}
    article ul li {{ margin-bottom: 8px; line-height: 1.7; }}
    article strong {{ color: #111827; font-weight: 700; }}
    article a {{ color: #2563EB; }}
    article code {{ background: #f3f4f6; padding: 1px 6px; border-radius: 4px; font-size: 14px; }}
    .quote {{ background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 22px; margin: 22px 0; border-radius: 0 10px 10px 0; font-size: 15px; color: #78350f; line-height: 1.7; }}
    .quote strong {{ color: #92400e; }}
    .ad-slot {{ margin: 28px 0; text-align: center; min-height: 90px; }}
    .cta-box {{ background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); color: white; padding: 32px 28px; border-radius: 14px; text-align: center; margin: 40px 0 24px; box-shadow: 0 8px 24px rgba(37,99,235,0.25); }}
    .cta-box h3 {{ color: white; font-size: 22px; font-weight: 700; margin: 0 0 10px; border: none; padding: 0; }}
    .cta-box p {{ font-size: 15px; opacity: 0.95; margin-bottom: 20px; }}
    .cta-btn {{ display: inline-block; background: white; color: #2563EB; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; transition: transform 0.15s; }}
    .cta-btn:hover {{ transform: translateY(-2px); }}
    .related-articles {{ margin-top: 48px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }}
    .related-articles h2 {{ margin: 0 0 14px; font-size: 17px; border: none; padding: 0; color: #1f2937; }}
    .related-articles a {{ display: block; padding: 12px 14px; background: #f3f4f6; border-radius: 8px; text-decoration: none; color: #1f2937; font-size: 14px; font-weight: 500; margin-top: 8px; }}
    .related-articles a:hover {{ background: #dbeafe; color: #1e40af; }}
    footer {{ background: #111827; color: #9ca3af; padding: 32px 24px; text-align: center; font-size: 13px; margin-top: 60px; }}
    footer a {{ color: #d1d5db; text-decoration: none; margin: 0 8px; }}
    footer a:hover {{ color: white; }}
    @media (max-width: 640px) {{
      article h1 {{ font-size: 22px; }}
      article h2 {{ font-size: 19px; }}
      .container {{ padding: 24px 16px 60px; }}
    }}
  </style>
</head>
<body>
  <div class="top-bar">
    <a href="/">
      <div class="logo-mark">₩</div>
      세금계산기
    </a>
  </div>

  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">홈</a> &rsaquo;
    <a href="/blog/">블로그</a> &rsaquo;
    <span>{breadcrumb_title}</span>
  </nav>

  <article class="container">
    <div class="meta-line">
      <span class="tag">{category_label}</span>
      <span>{date_display}</span>
      <span>&middot; 읽는 시간 약 {read_min}분</span>
    </div>

    <h1>{title}</h1>

    <p class="lead">{description}</p>

    {body_html}

    <div class="ad-slot">
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-2792604427181547"
        data-ad-slot="auto"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({{}});</script>
    </div>

    <div class="cta-box">
      <h3>👉 지금 바로 계산해보기</h3>
      <p>입력만 하면 즉시 결과 확인. 회원가입 없이 무료로 이용 가능합니다.</p>
      <a href="{cta_href}" class="cta-btn">{cta_label} →</a>
    </div>

    <div class="related-articles">
      <h2>🔗 관련 계산기</h2>
      {related_html}
    </div>
  </article>

  <footer>
    <div>© 2026 세금계산기 (taxcalc.co.kr) · 모든 계산은 참고용입니다</div>
    <div style="margin-top:10px">
      <a href="/">홈</a> &middot;
      <a href="/blog/">블로그</a> &middot;
      <a href="/about.html">사이트 소개</a> &middot;
      <a href="/privacy.html">개인정보처리방침</a> &middot;
      <a href="/contact.html">문의하기</a>
    </div>
  </footer>
</body>
</html>
"""


def render_post(meta: dict, parsed: dict) -> str:
    """단일 글 HTML 생성."""
    import json

    body_html = md_to_html(parsed["body_md"])

    related_html = "\n      ".join(
        f'<a href="{h}">{l}</a>' for h, l in meta.get("related", [])
    )
    if not related_html:
        related_html = '<a href="/blog/">다른 글 더 보기</a>'

    return PAGE_TEMPLATE.format(
        title=html_escape(parsed["title"]),
        og_title=html_escape(parsed["title"]),
        breadcrumb_title=html_escape(parsed["title"][:50]),
        description=html_escape(parsed["description"]),
        keywords=html_escape(",".join(parsed["hashtags"])),
        slug=meta["slug"],
        category_label=html_escape(meta["categoryLabel"]),
        date=meta["date"],
        date_display=meta["date"].replace("-", ".") + ".",
        read_min=meta["readMin"],
        cta_href=meta["ctaHref"],
        cta_label=html_escape(meta["ctaLabel"]),
        body_html=body_html,
        related_html=related_html,
        headline_json=json.dumps(parsed["title"], ensure_ascii=False),
        description_json=json.dumps(parsed["description"], ensure_ascii=False),
        title_json=json.dumps(parsed["title"][:50], ensure_ascii=False),
        category_label_json=json.dumps(meta["categoryLabel"], ensure_ascii=False),
    )


# ---------------------------------------------------------------------------
# 인덱스 (목록) 페이지 재생성
# ---------------------------------------------------------------------------

INDEX_TEMPLATE = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="세금계산기 블로그 - 부동산·자동차·소득·금융 세금에 대한 실전 가이드와 절세 팁을 정리합니다. 2026년 최신 세율 기준.">
  <meta name="keywords" content="세금계산기 블로그,세금 가이드,절세 팁,취득세,양도세,종합소득세,2026년 세금">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://taxcalc.co.kr/blog/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta name="google-adsense-account" content="ca-pub-2792604427181547">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2792604427181547" crossorigin="anonymous"></script>
  <title>블로그 | 세금계산기</title>

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="세금계산기">
  <meta property="og:title" content="세금계산기 블로그 — 실전 절세 가이드">
  <meta property="og:description" content="부동산·자동차·소득·금융 세금에 대한 실전 가이드와 절세 팁을 정리합니다.">
  <meta property="og:url" content="https://taxcalc.co.kr/blog/">
  <meta property="og:image" content="https://taxcalc.co.kr/og-image.png">
  <meta property="og:locale" content="ko_KR">

  <script type="application/ld+json">
{blog_jsonld}
  </script>

  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: 'Pretendard', -apple-system, sans-serif; background: #f8f9fa; color: #1f2937; line-height: 1.7; }}
    .top-bar {{ background: #2563EB; padding: 14px 24px; display: flex; align-items: center; gap: 12px; }}
    .top-bar a {{ color: white; text-decoration: none; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px; }}
    .top-bar .logo-mark {{ width: 34px; height: 34px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: #2563EB; }}
    .breadcrumb {{ background: #eef2ff; padding: 10px 24px; font-size: 13px; color: #4338ca; }}
    .breadcrumb a {{ color: #4338ca; text-decoration: none; }}
    .breadcrumb a:hover {{ text-decoration: underline; }}
    .container {{ max-width: 820px; margin: 0 auto; padding: 48px 20px 80px; }}
    .hero {{ background: linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%); color: white; padding: 36px 32px; border-radius: 16px; margin-bottom: 36px; }}
    .hero h1 {{ font-size: 28px; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.5px; }}
    .hero p {{ font-size: 15.5px; opacity: 0.95; margin: 0; }}
    .filter-bar {{ display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; padding: 14px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; }}
    .filter-chip {{ background: #f3f4f6; color: #4b5563; border: 1px solid transparent; padding: 7px 14px; border-radius: 20px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; }}
    .filter-chip:hover {{ background: #e5e7eb; }}
    .filter-chip.active {{ background: #2563EB; color: white; border-color: #2563EB; }}
    .filter-count {{ margin-left: auto; align-self: center; font-size: 12.5px; color: #6b7280; }}
    .post-list {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }}
    .post-card {{ background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; transition: transform 0.15s, box-shadow 0.15s; display: flex; flex-direction: column; }}
    .post-card:hover {{ transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.06); }}
    .post-card.is-hidden {{ display: none; }}
    .post-thumb {{ display: block; aspect-ratio: 1200/630; overflow: hidden; background: #eef2ff; }}
    .post-thumb img {{ width: 100%; height: 100%; object-fit: cover; display: block; }}
    .post-body {{ padding: 18px 22px 22px; }}
    .post-meta {{ display: flex; gap: 12px; align-items: center; flex-wrap: wrap; font-size: 12.5px; color: #6b7280; margin-bottom: 10px; }}
    .post-meta .tag {{ background: #eef2ff; color: #4338ca; padding: 2px 9px; border-radius: 6px; font-weight: 600; }}
    .post-card h2 {{ margin: 0 0 8px; }}
    .post-card h2 a {{ font-size: 19px; font-weight: 700; color: #111827; text-decoration: none; line-height: 1.45; }}
    .post-card h2 a:hover {{ color: #2563EB; }}
    .post-card .excerpt {{ font-size: 14.5px; color: #4b5563; line-height: 1.7; margin: 0; }}
    .empty-filter {{ background: white; border: 1px dashed #d1d5db; border-radius: 12px; padding: 36px 24px; text-align: center; color: #9ca3af; font-size: 14px; }}
    .empty-filter.is-hidden {{ display: none; }}
    .pagination {{ display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 28px; flex-wrap: wrap; }}
    .pagination button {{ background: white; border: 1px solid #e5e7eb; color: #4b5563; padding: 8px 14px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; min-width: 38px; font-family: inherit; }}
    .pagination button:hover:not(:disabled) {{ background: #eef2ff; color: #2563EB; border-color: #c7d2fe; }}
    .pagination button.active {{ background: #2563EB; color: white; border-color: #2563EB; }}
    .pagination button:disabled {{ opacity: 0.4; cursor: not-allowed; }}
    .pagination.is-hidden {{ display: none; }}
    .back-link {{ display: inline-flex; align-items: center; gap: 6px; margin-top: 36px; padding: 12px 24px; background: #2563EB; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; }}
    .back-link:hover {{ background: #1d4ed8; }}
    footer {{ background: #111827; color: #9ca3af; padding: 32px 24px; text-align: center; font-size: 13px; margin-top: 60px; }}
    footer a {{ color: #d1d5db; text-decoration: none; margin: 0 8px; }}
    footer a:hover {{ color: white; }}
    @media (max-width: 640px) {{
      .hero h1 {{ font-size: 22px; }}
      .hero {{ padding: 28px 22px; }}
    }}
  </style>
</head>
<body>
  <div class="top-bar">
    <a href="/">
      <div class="logo-mark">₩</div>
      세금계산기
    </a>
  </div>

  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">홈</a> &rsaquo;
    <span>블로그</span>
  </nav>

  <div class="container">
    <div class="hero">
      <h1>세금계산기 블로그</h1>
      <p>부동산·자동차·소득·금융 세금에 대한 실전 가이드와 절세 팁을 정리합니다. 2026년 최신 세율 기준.</p>
    </div>

    <div class="filter-bar" role="tablist" aria-label="블로그 카테고리 필터">
{filter_chips}
      <span class="filter-count" id="filter-count">전체 {total_count}개</span>
    </div>

    <div class="post-list" id="post-list">
{post_cards}
    </div>

    <div class="empty-filter is-hidden" id="empty-filter">
      해당 카테고리의 글이 아직 없습니다. 다른 카테고리를 선택해보세요.
    </div>

    <nav class="pagination is-hidden" id="pagination" aria-label="블로그 페이지 이동"></nav>

    <a href="/" class="back-link">← 세금계산기로 돌아가기</a>

  <script>
    (function () {{
      var POSTS_PER_PAGE = 6;
      var listEl = document.getElementById('post-list');
      var chips = document.querySelectorAll('.filter-chip');
      var countEl = document.getElementById('filter-count');
      var emptyEl = document.getElementById('empty-filter');
      var pagerEl = document.getElementById('pagination');
      var allCards = Array.prototype.slice.call(listEl.querySelectorAll('.post-card'));
      var currentFilter = 'all';
      var currentPage = 1;

      function visibleCards() {{
        return allCards.filter(function (c) {{
          return currentFilter === 'all' || c.dataset.category === currentFilter;
        }});
      }}

      function render() {{
        var visible = visibleCards();
        var totalPages = Math.max(1, Math.ceil(visible.length / POSTS_PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;
        var start = (currentPage - 1) * POSTS_PER_PAGE;
        var end = start + POSTS_PER_PAGE;

        allCards.forEach(function (card) {{
          var inFilter = currentFilter === 'all' || card.dataset.category === currentFilter;
          var idxInFiltered = visible.indexOf(card);
          var inPage = inFilter && idxInFiltered >= start && idxInFiltered < end;
          card.classList.toggle('is-hidden', !inPage);
        }});

        countEl.textContent = currentFilter === 'all'
          ? '전체 ' + visible.length + '개'
          : visible.length + '개 글';
        emptyEl.classList.toggle('is-hidden', visible.length > 0);

        if (visible.length <= POSTS_PER_PAGE) {{
          pagerEl.classList.add('is-hidden');
          pagerEl.innerHTML = '';
          return;
        }}
        pagerEl.classList.remove('is-hidden');
        pagerEl.innerHTML = '';

        var prev = document.createElement('button');
        prev.type = 'button';
        prev.textContent = '←';
        prev.disabled = currentPage === 1;
        prev.addEventListener('click', function () {{ currentPage--; render(); window.scrollTo({{top:0,behavior:'smooth'}}); }});
        pagerEl.appendChild(prev);

        for (var i = 1; i <= totalPages; i++) {{
          (function (page) {{
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = String(page);
            if (page === currentPage) btn.classList.add('active');
            btn.addEventListener('click', function () {{ currentPage = page; render(); window.scrollTo({{top:0,behavior:'smooth'}}); }});
            pagerEl.appendChild(btn);
          }})(i);
        }}

        var next = document.createElement('button');
        next.type = 'button';
        next.textContent = '→';
        next.disabled = currentPage === totalPages;
        next.addEventListener('click', function () {{ currentPage++; render(); window.scrollTo({{top:0,behavior:'smooth'}}); }});
        pagerEl.appendChild(next);
      }}

      chips.forEach(function (chip) {{
        chip.addEventListener('click', function () {{
          chips.forEach(function (c) {{
            c.classList.remove('active');
            c.setAttribute('aria-selected', 'false');
          }});
          chip.classList.add('active');
          chip.setAttribute('aria-selected', 'true');
          currentFilter = chip.dataset.filter;
          currentPage = 1;
          render();
        }});
      }});

      render();
    }})();
  </script>
  </div>

  <footer>
    <div>© 2026 세금계산기 (taxcalc.co.kr) · 모든 계산은 참고용입니다</div>
    <div style="margin-top:10px">
      <a href="/">홈</a> &middot;
      <a href="/blog/">블로그</a> &middot;
      <a href="/about.html">사이트 소개</a> &middot;
      <a href="/privacy.html">개인정보처리방침</a> &middot;
      <a href="/contact.html">문의하기</a>
    </div>
  </footer>
</body>
</html>
"""


def render_index(posts: list[dict]) -> str:
    import json

    # 카테고리 칩: 등장 카테고리만 노출 (안정 순서)
    cat_order = [
        ("all", "전체"),
        ("real-estate", "부동산"),
        ("finance", "금융"),
        ("labor", "근로"),
        ("inherit", "상속·증여"),
        ("vehicle", "자동차"),
        ("loan", "대출"),
        ("fines", "과태료"),
    ]
    present = {p["meta"]["category"] for p in posts}
    chips_html = []
    for i, (cid, label) in enumerate(cat_order):
        if cid != "all" and cid not in present:
            continue
        active = " active" if cid == "all" else ""
        aria = "true" if cid == "all" else "false"
        chips_html.append(
            f'      <button class="filter-chip{active}" data-filter="{cid}" type="button" role="tab" aria-selected="{aria}">{label}</button>'
        )

    # 카드: 날짜 내림차순 정렬
    posts_sorted = sorted(posts, key=lambda p: p["meta"]["date"], reverse=True)
    cards_html = []
    for p in posts_sorted:
        meta = p["meta"]
        parsed = p["parsed"]
        excerpt = make_excerpt(parsed["description"])
        cards_html.append(f'''      <article class="post-card" data-category="{meta['category']}">
        <a class="post-thumb" href="/blog/{meta['slug']}.html">
          <img src="/thumbnails/{meta['slug']}.webp" alt="{html_escape(parsed['title'][:60])}" width="1200" height="630" loading="lazy">
        </a>
        <div class="post-body">
          <div class="post-meta">
            <span class="tag">{html_escape(meta['categoryLabel'])}</span>
            <span>{meta['date'].replace('-', '년 ', 1).replace('-', '월 ') + '일'}</span>
            <span>&middot; {meta['readMin']}분</span>
          </div>
          <h2><a href="/blog/{meta['slug']}.html">{html_escape(parsed['title'])}</a></h2>
          <p class="excerpt">{html_escape(excerpt)}</p>
        </div>
      </article>''')

    # JSON-LD blog 스키마
    blog_jsonld = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "세금계산기 블로그",
        "url": "https://taxcalc.co.kr/blog/",
        "description": "부동산·자동차·소득·금융 세금에 대한 실전 가이드와 절세 팁",
        "publisher": {
            "@type": "Organization",
            "name": "세금계산기",
            "url": "https://taxcalc.co.kr/",
        },
        "blogPost": [
            {
                "@type": "BlogPosting",
                "headline": p["parsed"]["title"],
                "url": f"https://taxcalc.co.kr/blog/{p['meta']['slug']}.html",
                "datePublished": p["meta"]["date"],
                "image": "https://taxcalc.co.kr/og-image.png",
            }
            for p in posts_sorted
        ],
    }
    jsonld_str = json.dumps(blog_jsonld, ensure_ascii=False, indent=2)

    return INDEX_TEMPLATE.format(
        filter_chips="\n".join(chips_html),
        total_count=len(posts_sorted),
        post_cards="\n".join(cards_html),
        blog_jsonld=jsonld_str,
    )


# ---------------------------------------------------------------------------
# 메인
# ---------------------------------------------------------------------------

def main() -> int:
    if not POST_DIR.exists():
        print(f"[!] 원고 디렉터리 없음: {POST_DIR}")
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    processed = []
    for meta in POSTS:
        md_path = POST_DIR / f"{meta['file']}.md"
        if not md_path.exists():
            print(f"[!] 원고 누락: {md_path.name}")
            continue
        try:
            parsed = parse_post(md_path)
        except ValueError as e:
            print(f"[!] 파싱 오류 — {e}")
            continue

        processed.append({"meta": meta, "parsed": parsed})

        if meta.get("customHtml"):
            print(f"  · {meta['slug']:30s} (custom HTML, 본문 빌드 스킵)")
            continue

        html = render_post(meta, parsed)
        out_path = OUT_DIR / f"{meta['slug']}.html"
        out_path.write_text(html, encoding="utf-8")
        print(f"  ✓ {out_path.relative_to(ROOT)}  (FAQ/H2 자동변환)")

    # 인덱스 재생성
    index_html = render_index(processed)
    INDEX_PATH.write_text(index_html, encoding="utf-8")
    print(f"\n▶ blog/index.html 재생성 — 총 {len(processed)}편")
    print(f"▶ 빌드 완료")
    return 0


if __name__ == "__main__":
    sys.exit(main())
