#!/usr/bin/env python3
"""
build.py — 정적 계산기 페이지 빌더

사용법:
    python3 build/build.py

동작:
    build/content/*.html 파일들을 읽어 build/templates/calculator-page.html
    템플릿에 적용한 뒤, 프로젝트 루트에 {route-id}.html 로 출력합니다.
    출력 후 sitemap.xml 도 자동 갱신합니다.
"""

import json
import re
import sys
import hashlib
import subprocess
from html import escape
from datetime import date
from pathlib import Path

from page_metadata import LIMITS, PAGE_LIMITS, REFERENCES, REVIEW_DATE
from site_html import SiteHTML

# ---------------------------------------------------------------------------
# 설정
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "build" / "content"
TEMPLATE_PATH = ROOT / "build" / "templates" / "calculator-page.html"
OUTPUT_ROOT = ROOT
SITEMAP_PATH = ROOT / "sitemap.xml"
DATES_PATH = ROOT / "build" / "page_dates.json"
DATES = json.loads(DATES_PATH.read_text()) if DATES_PATH.exists() else {}
SPA = None
MODULES = {}
GUIDES = {}


def git_date(path: Path, first=False) -> str:
    args = ['git', 'log', '-1', '--format=%as']
    if first:
        args.append('--diff-filter=A')
    result = subprocess.run(args + ['--', str(path.relative_to(ROOT))], cwd=ROOT,
                            capture_output=True, text=True, check=True)
    return result.stdout.strip() or REVIEW_DATE


def document_dates(path: Path, signature=None) -> dict:
    key = path.relative_to(ROOT).as_posix()
    content = signature if signature is not None else path.read_text(encoding='utf-8')
    digest = hashlib.sha256(content.encode()).hexdigest()
    previous = DATES.get(key)
    if previous and previous['digest'] == digest:
        return previous
    dirty = subprocess.run(['git', 'diff', 'HEAD', '--', key], cwd=ROOT,
                           capture_output=True, text=True, check=True).stdout
    dates = {'published': previous['published'] if previous else git_date(path, first=True),
             'modified': date.today().isoformat() if previous or dirty else git_date(path),
             'digest': digest}
    DATES[key] = dates
    return dates


def load_runtime():
    global SPA
    SPA = SiteHTML((ROOT / 'index.html').read_text(encoding='utf-8'))
    for src in SPA.scripts:
        if not src.startswith('js/calculators/'):
            continue
        code = (ROOT / src.split('?')[0]).read_text(encoding='utf-8')
        view = re.search(r"getElementById\('(?P<id>view-[^']+)'\)", code)
        symbol = re.search(r'const (Calc\w+) =', code)
        if not view or not symbol:
            raise ValueError(f'Module missing view or initializer: {src}')
        MODULES[view['id']] = (src, symbol[1], code)
    for path in sorted((ROOT / 'blog').glob('*.html')):
        if path.name == 'index.html':
            continue
        raw = path.read_text(encoding='utf-8')
        doc = SiteHTML(raw)
        title_match = re.search(r'<h1[^>]*>(.*?)</h1>', raw, re.DOTALL)
        if not title_match:
            raise ValueError(f'Blog missing heading: {path}')
        title = strip_tags(title_match[1])
        published = re.search(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})', raw)
        guide_date = published[1] if published else git_date(path, first=True)
        for link in set(doc.links):
            if link.startswith('https://taxcalc.co.kr/'):
                link = link.removeprefix('https://taxcalc.co.kr')
            if link.startswith('/#'):
                route = link[2:]
            elif link.startswith('/') and not link.startswith('/blog/') and link.endswith('.html'):
                route = link[1:-5]
            else:
                continue
            GUIDES.setdefault(route, []).append((path, title, guide_date))


def render_runtime(route):
    view_id = 'view-' + route.replace('/', '-')
    module = MODULES.get(view_id)
    if not module:
        return '', '<script src="/js/theme.js"></script><script>Theme.init();</script>', ''
    if view_id not in SPA.elements:
        raise ValueError(f'Calculator view missing: {view_id}')
    src, symbol, code = module
    view = SPA.elements[view_id]
    scripts = [src for src in SPA.scripts if src.split('?')[0] in
               {'js/ui.js', 'js/theme.js', 'js/ads.js'}] + [src]
    tags = '\n'.join(f'<script src="/{escape(src, quote=True)}"></script>' for src in scripts)
    tags += (f'\n<script>document.addEventListener("DOMContentLoaded", () => {{'
             f'Theme.init(); {symbol}.init(); document.body.dataset.calculatorReady = "true";'
             '});</script>')
    return f'<section id="calculator" class="static-calculator" aria-label="계산 입력과 결과">{view}</section>', tags, view + code


def render_directory(pages):
    sections = []
    for category, cat in CATEGORIES.items():
        links = ''.join(f'<li><a href="/{p["id"]}.html">{escape(p["title"])}</a></li>'
                        for p in pages.values() if p['id'].startswith(category + '/'))
        sections.append(f'<section><h3>{cat["label"]}</h3><ul>{links}</ul></section>')
    return ''.join(sections)


def render_guides(route):
    unique = {item[0]: item for item in GUIDES.get(route, [])}
    guides = sorted(unique.values(), key=lambda item: (item[2], item[0].name), reverse=True)[:3]
    if not guides:
        return ''
    links = ''.join(f'<li><a href="/blog/{path.name}">{escape(title)}</a></li>' for path, title, _ in guides)
    return f'<section class="static-prose"><h2>함께 읽는 세금 가이드</h2><ul>{links}</ul></section>'

CATEGORIES = {
    "loan":        {"label": "대출",       "icon": "🏦"},
    "real-estate": {"label": "부동산",     "icon": "🏠"},
    "inherit":     {"label": "상속·증여",  "icon": "📜"},
    "vehicle":     {"label": "자동차",     "icon": "🚗"},
    "income":      {"label": "소득",       "icon": "💼"},
    "stocks":      {"label": "주식·금융",  "icon": "📈"},
    "fines":       {"label": "과태료",     "icon": "🚨"},
    "other":       {"label": "기타",       "icon": "📋"},
}

# sitemap 상단(고정 URL)
STATIC_SITEMAP_URLS = [
    ("https://taxcalc.co.kr/",                                      "monthly", "1.0"),
    ("https://taxcalc.co.kr/blog/",                                 "weekly",  "0.8"),
    ("https://taxcalc.co.kr/about.html",                            "yearly",  "0.5"),
    ("https://taxcalc.co.kr/contact.html",                          "yearly",  "0.5"),
    ("https://taxcalc.co.kr/privacy.html",                          "yearly",  "0.3"),
]


def discover_blog_urls() -> list:
    """blog/*.html 파일을 스캔해 sitemap 항목 자동 생성 (index.html 제외)."""
    blog_dir = ROOT / "blog"
    if not blog_dir.exists():
        return []
    urls = []
    for path in sorted(blog_dir.glob("*.html")):
        if path.name == "index.html":
            continue
        urls.append((f"https://taxcalc.co.kr/blog/{path.name}", "monthly", "0.7"))
    return urls

# ---------------------------------------------------------------------------
# 유틸
# ---------------------------------------------------------------------------

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)$", re.DOTALL)
DETAILS_RE = re.compile(
    r"<details[^>]*>\s*<summary>(.*?)</summary>\s*(.*?)\s*</details>",
    re.DOTALL,
)
TAG_RE = re.compile(r"<[^>]+>")


def strip_tags(s: str) -> str:
    """간단 태그 제거 (FAQ 질문 텍스트용)."""
    return TAG_RE.sub("", s).strip()


def extract_faqs(body: str) -> list[dict]:
    """본문에서 <details><summary>...</summary>...</details> 블록을 찾아 Q&A 추출."""
    faqs = []
    for m in DETAILS_RE.finditer(body):
        question = strip_tags(m.group(1))
        answer_html = m.group(2).strip()
        if not question or not answer_html:
            continue
        faqs.append({"q": question, "a": answer_html})
    return faqs


def render_faq_jsonld(faqs: list[dict]) -> str:
    """FAQ 리스트를 Schema.org FAQPage JSON-LD 스크립트로 렌더링."""
    if not faqs:
        return ""
    data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": faq["q"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq["a"],
                },
            }
            for faq in faqs
        ],
    }
    body = json.dumps(data, ensure_ascii=False, indent=2).replace('<', '\\u003c')
    return '  <script type="application/ld+json">\n' + body + "\n  </script>"


def parse_content_file(path: Path) -> dict:
    """content/*.html 파일을 파싱해 meta + body 반환."""
    raw = path.read_text(encoding="utf-8")
    m = FRONTMATTER_RE.match(raw)
    if not m:
        raise ValueError(f"{path.name}: frontmatter(--- ... ---) 누락")
    try:
        meta = json.loads(m.group(1))
    except json.JSONDecodeError as e:
        raise ValueError(f"{path.name}: frontmatter JSON 파싱 오류 — {e}")
    body = m.group(2).strip()

    # 필수 필드 검증
    required = ["id", "title", "metaTitle", "metaDescription", "lead"]
    for field in required:
        if field not in meta:
            raise ValueError(f"{path.name}: 필수 필드 '{field}' 누락")

    meta.setdefault("keywords", [])
    meta.setdefault("related", [])
    meta.setdefault("priority", "0.8")
    meta.setdefault("changefreq", "monthly")

    meta["body"] = body
    meta["source_path"] = str(path)
    return meta


def load_all_content() -> dict[str, dict]:
    """content/ 디렉터리의 모든 페이지 로드."""
    if not CONTENT_DIR.exists():
        print(f"[!] 콘텐츠 디렉터리가 없습니다: {CONTENT_DIR}")
        sys.exit(1)

    pages: dict[str, dict] = {}
    for path in sorted(CONTENT_DIR.glob("*.html")):
        try:
            meta = parse_content_file(path)
        except ValueError as e:
            print(f"[!] {e}")
            sys.exit(1)

        if meta["id"] in pages:
            print(f"[!] 중복 id: {meta['id']} ({path.name})")
            sys.exit(1)
        pages[meta["id"]] = meta
    return pages


def render_related(meta: dict, all_pages: dict) -> str:
    """관련 계산기 링크 HTML 생성."""
    related_ids = meta.get("related", [])
    if not related_ids:
        return '<p style="color:#9ca3af;font-size:14px;margin:0">관련 계산기가 곧 추가될 예정입니다.</p>'

    items = []
    for rid in related_ids:
        target = all_pages.get(rid)
        if target:
            # 정적 HTML 링크
            items.append(f'<a href="/{rid}.html">{target["title"]}</a>')
        else:
            raise ValueError(f'{meta["id"]}: unknown related route {rid}')
    return "\n        ".join(items)


def render_page(meta: dict, template: str, all_pages: dict) -> str:
    """단일 페이지 렌더링."""
    category_id = meta["id"].split("/")[0]
    cat = CATEGORIES.get(category_id, {"label": category_id, "icon": "📋"})

    # route-id 의 깊이에 따른 루트 경로 (출력은 항상 루트 바로 아래 서브폴더 1단계 가정)
    # 예: real-estate/acquisition.html → "../" 이 아닌 "/"로 고정해 절대 경로 사용
    faqs = extract_faqs(meta["body"])
    faq_jsonld = render_faq_jsonld(faqs)
    calculator, scripts, runtime_signature = render_runtime(meta['id'])
    sources = REFERENCES[meta['id']]
    limits = PAGE_LIMITS.get(meta['id'], LIMITS[category_id])
    guides = render_guides(meta['id'])
    signature = json.dumps(meta, ensure_ascii=False, sort_keys=True) + template + runtime_signature
    signature += json.dumps(sources, ensure_ascii=False) + limits + guides
    signature += ''.join((ROOT / src.split('?')[0]).read_text(encoding='utf-8')
                         for src in SPA.scripts if src.startswith(('js/ui.js', 'js/theme.js', 'js/ads.js')))
    signature += ''.join(path.read_text(encoding='utf-8') for path in sorted((ROOT / 'css').glob('*.css')))
    dates = document_dates(ROOT / f'{meta["id"]}.html', signature)
    meta['_modified'] = dates['modified']
    url = f'https://taxcalc.co.kr/{meta["id"]}.html'
    schema = [{
        '@context': 'https://schema.org', '@type': 'WebPage', 'name': meta['title'],
        'url': url, 'description': meta['metaDescription'], 'inLanguage': 'ko',
        'datePublished': dates['published'], 'dateModified': dates['modified'],
        'author': {'@type': 'Organization', 'name': 'TaxCalc Korea'},
    }, {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'TaxCalc Korea', 'item': 'https://taxcalc.co.kr/'},
            {'@type': 'ListItem', 'position': 2, 'name': cat['label'], 'item': f'https://taxcalc.co.kr/#calculators-{category_id}'},
            {'@type': 'ListItem', 'position': 3, 'name': meta['title'], 'item': url},
        ],
    }]
    if calculator:
        schema.append({'@context': 'https://schema.org', '@type': 'WebApplication',
                       'name': meta['title'] + ' | TaxCalc Korea', 'url': url,
                       'applicationCategory': 'FinanceApplication', 'operatingSystem': 'Web',
                       'inLanguage': 'ko', 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'KRW'}})

    replacements = {
        "{{META_TITLE}}":       escape(meta["metaTitle"].removesuffix(' | 세금계산기'), quote=True),
        "{{META_DESCRIPTION}}": escape(meta["metaDescription"], quote=True),
        "{{META_KEYWORDS}}":    ",".join(meta["keywords"]),
        "{{TITLE}}":            escape(meta["title"]),
        "{{LEAD}}":             escape(meta["lead"]),
        "{{ROUTE_ID}}":         meta["id"],
        "{{CATEGORY_ID}}":      category_id,
        "{{CATEGORY_LABEL}}":   cat["label"],
        "{{CATEGORY_ICON}}":    cat["icon"],
        "{{ROOT}}":             "/",
        "{{BODY}}":             meta["body"],
        "{{RELATED_LINKS}}":    render_related(meta, all_pages),
        "{{FAQ_JSONLD}}":       faq_jsonld,
        '{{SCHEMA_JSONLD}}': '<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False).replace('<', '\\u003c') + '</script>',
        '{{CALCULATOR}}': calculator,
        '{{RUNTIME_SCRIPTS}}': scripts,
        '{{PUBLISHED_DATE}}': dates['published'],
        '{{MODIFIED_DATE}}': dates['modified'],
        '{{REVIEW_DATE}}': REVIEW_DATE,
        '{{LIMITS}}': escape(limits),
        '{{SOURCES}}': ''.join(f'<li><a href="{escape(url, quote=True)}" rel="noopener" target="_blank">{escape(label)}</a></li>' for label, url in sources),
        '{{GUIDE_LINKS}}': guides,
        '{{DIRECTORY}}': render_directory(all_pages),
    }

    meta["_faq_count"] = len(faqs)

    out = template
    for key, val in replacements.items():
        out = out.replace(key, val)
    return out


def write_output(meta: dict, html: str) -> Path:
    """출력 파일 쓰기."""
    out_path = OUTPUT_ROOT / f"{meta['id']}.html"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text('\n'.join(line.rstrip() for line in html.splitlines()) + '\n', encoding="utf-8")
    return out_path


def build_sitemap(pages: dict) -> None:
    """sitemap.xml 재생성."""
    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

    # 정적 URL
    for loc, changefreq, priority in STATIC_SITEMAP_URLS:
        relative = loc.removeprefix('https://taxcalc.co.kr/').rstrip('/')
        path = ROOT / (relative + '/index.html' if relative == 'blog' else relative or 'index.html')
        modified = document_dates(path)['modified']
        lines.append("  <url>")
        lines.append(f"    <loc>{loc}</loc>")
        lines.append(f"    <lastmod>{modified}</lastmod>")
        lines.append(f"    <changefreq>{changefreq}</changefreq>")
        lines.append(f"    <priority>{priority}</priority>")
        lines.append("  </url>")

    # 블로그 페이지 (blog/*.html 자동 스캔)
    blog_urls = discover_blog_urls()
    if blog_urls:
        lines.append("  <!-- 블로그 -->")
        for loc, changefreq, priority in blog_urls:
            modified = document_dates(ROOT / loc.removeprefix('https://taxcalc.co.kr/'))['modified']
            lines.append("  <url>")
            lines.append(f"    <loc>{loc}</loc>")
            lines.append(f"    <lastmod>{modified}</lastmod>")
            lines.append(f"    <changefreq>{changefreq}</changefreq>")
            lines.append(f"    <priority>{priority}</priority>")
            lines.append("  </url>")

    # 생성된 계산기 페이지 (카테고리 그룹별 정렬)
    by_cat: dict[str, list] = {}
    for page in pages.values():
        cat_id = page["id"].split("/")[0]
        by_cat.setdefault(cat_id, []).append(page)

    for cat_id in CATEGORIES.keys():
        if cat_id not in by_cat:
            continue
        cat_label = CATEGORIES[cat_id]["label"]
        lines.append(f"  <!-- {cat_label} -->")
        for page in sorted(by_cat[cat_id], key=lambda p: p["id"]):
            lines.append("  <url>")
            lines.append(f"    <loc>https://taxcalc.co.kr/{page['id']}.html</loc>")
            lines.append(f"    <lastmod>{page['_modified']}</lastmod>")
            lines.append(f"    <changefreq>{page['changefreq']}</changefreq>")
            lines.append(f"    <priority>{page['priority']}</priority>")
            lines.append("  </url>")

    lines.append("</urlset>")
    SITEMAP_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


# ---------------------------------------------------------------------------
# 엔트리
# ---------------------------------------------------------------------------

def main() -> int:
    if not TEMPLATE_PATH.exists():
        print(f"[!] 템플릿을 찾을 수 없습니다: {TEMPLATE_PATH}")
        return 1

    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    pages = load_all_content()
    load_runtime()

    if not pages:
        print("[!] content/ 에 페이지가 없습니다.")
        return 1

    print(f"▶ 총 {len(pages)}개 페이지 빌드 시작")
    written = []
    no_faq = []
    for meta in pages.values():
        html = render_page(meta, template, pages)
        out_path = write_output(meta, html)
        written.append(out_path.relative_to(ROOT))
        faq_count = meta.get("_faq_count", 0)
        marker = f"FAQ {faq_count}" if faq_count else "FAQ 없음"
        print(f"  ✓ {out_path.relative_to(ROOT)}  ({marker})")
        if faq_count == 0:
            no_faq.append(meta["id"])

    build_sitemap(pages)
    DATES_PATH.write_text(json.dumps(DATES, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    total_urls = len(pages) + len(STATIC_SITEMAP_URLS) + len(discover_blog_urls())
    print(f"\n▶ sitemap.xml 갱신 완료 ({total_urls} URL)")
    print(f"▶ 빌드 완료: {len(written)}개 파일")
    if no_faq:
        print(f"\n[!] FAQ 누락 페이지 {len(no_faq)}개 (FAQPage 스키마 미생성):")
        for rid in no_faq:
            print(f"    - {rid}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
