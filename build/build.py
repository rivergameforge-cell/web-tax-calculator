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
from datetime import date
from pathlib import Path

# ---------------------------------------------------------------------------
# 설정
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "build" / "content"
TEMPLATE_PATH = ROOT / "build" / "templates" / "calculator-page.html"
OUTPUT_ROOT = ROOT
SITEMAP_PATH = ROOT / "sitemap.xml"

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
    ("https://taxcalc.co.kr/",            "monthly", "1.0"),
    ("https://taxcalc.co.kr/about.html",  "yearly",  "0.5"),
    ("https://taxcalc.co.kr/privacy.html","yearly",  "0.3"),
]

# ---------------------------------------------------------------------------
# 유틸
# ---------------------------------------------------------------------------

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)$", re.DOTALL)


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
            # 아직 정적 페이지 없음 → SPA 해시로 이동
            label = rid.split("/")[-1].replace("-", " ")
            items.append(f'<a href="/#{rid}">{label}</a>')
    return "\n        ".join(items)


def render_page(meta: dict, template: str, all_pages: dict) -> str:
    """단일 페이지 렌더링."""
    category_id = meta["id"].split("/")[0]
    cat = CATEGORIES.get(category_id, {"label": category_id, "icon": "📋"})

    # route-id 의 깊이에 따른 루트 경로 (출력은 항상 루트 바로 아래 서브폴더 1단계 가정)
    # 예: real-estate/acquisition.html → "../" 이 아닌 "/"로 고정해 절대 경로 사용
    replacements = {
        "{{META_TITLE}}":       meta["metaTitle"],
        "{{META_DESCRIPTION}}": meta["metaDescription"],
        "{{META_KEYWORDS}}":    ",".join(meta["keywords"]),
        "{{TITLE}}":            meta["title"],
        "{{LEAD}}":             meta["lead"],
        "{{ROUTE_ID}}":         meta["id"],
        "{{CATEGORY_ID}}":      category_id,
        "{{CATEGORY_LABEL}}":   cat["label"],
        "{{CATEGORY_ICON}}":    cat["icon"],
        "{{ROOT}}":             "/",
        "{{BODY}}":             meta["body"],
        "{{RELATED_LINKS}}":    render_related(meta, all_pages),
    }

    out = template
    for key, val in replacements.items():
        out = out.replace(key, val)
    return out


def write_output(meta: dict, html: str) -> Path:
    """출력 파일 쓰기."""
    out_path = OUTPUT_ROOT / f"{meta['id']}.html"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")
    return out_path


def build_sitemap(pages: dict) -> None:
    """sitemap.xml 재생성."""
    today = date.today().isoformat()
    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

    # 정적 URL
    for loc, changefreq, priority in STATIC_SITEMAP_URLS:
        lines.append("  <url>")
        lines.append(f"    <loc>{loc}</loc>")
        lines.append(f"    <lastmod>{today}</lastmod>")
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
            lines.append(f"    <lastmod>{today}</lastmod>")
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

    if not pages:
        print("[!] content/ 에 페이지가 없습니다.")
        return 1

    print(f"▶ 총 {len(pages)}개 페이지 빌드 시작")
    written = []
    for meta in pages.values():
        html = render_page(meta, template, pages)
        out_path = write_output(meta, html)
        written.append(out_path.relative_to(ROOT))
        print(f"  ✓ {out_path.relative_to(ROOT)}")

    build_sitemap(pages)
    print(f"\n▶ sitemap.xml 갱신 완료 ({len(pages) + len(STATIC_SITEMAP_URLS)} URL)")
    print(f"▶ 빌드 완료: {len(written)}개 파일")
    return 0


if __name__ == "__main__":
    sys.exit(main())
