#!/usr/bin/env python3
"""
tistory_prepare.py — 티스토리 업로드 준비 도구

티스토리 Open API 종료 이후, *_티스토리.txt 원고를 업로드하기 쉽게
제목/본문/태그/이미지 정보를 분리하고 로컬 복사 도우미 HTML을 생성합니다.

사용법:
    python3 build/tistory_prepare.py blog_post/해외주식_양도소득세_250만원_공제_티스토리.txt

출력:
    tistory_upload/<slug>/
      ├── title.txt
      ├── body.html
      ├── tags.txt
      ├── image-path.txt
      └── upload-helper.html
"""

from __future__ import annotations

import argparse
import html
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
POST_DIR = ROOT / "blog_post"
THUMB_DIR = ROOT / "thumbnails"
OUT_ROOT = ROOT / "tistory_upload"

TITLE_RE = re.compile(
    r"<!--\s*티스토리 제목.*?-->\s*<!--\s*(?P<title>.+?)\s*-->",
    re.DOTALL,
)
TAGS_RE = re.compile(
    r"<!--\s*해시태그.*?-->\s*<!--\s*(?P<tags>.+?)\s*-->\s*$",
    re.DOTALL,
)
P_TAG_TEXT_RE = re.compile(r"<[^>]+>")


def slugify(path: Path) -> str:
    name = path.stem
    suffix = "_티스토리"
    if name.endswith(suffix):
        name = name[: -len(suffix)]
    return re.sub(r"[^0-9A-Za-z가-힣_-]+", "-", name).strip("-_")


def parse_tistory_post(path: Path) -> dict[str, str]:
    raw = path.read_text(encoding="utf-8")

    title_match = TITLE_RE.search(raw)
    if not title_match:
        raise ValueError(f"{path.name}: 티스토리 제목 주석을 찾지 못했습니다.")
    title = title_match.group("title").strip()

    tags_match = TAGS_RE.search(raw)
    tags = ""
    body_end = len(raw)
    if tags_match:
        tags = ", ".join(
            tag.strip().lstrip("#")
            for tag in tags_match.group("tags").split(",")
            if tag.strip()
        )
        body_end = tags_match.start()

    body_start = title_match.end()
    body = raw[body_start:body_end].strip()

    # 제목 주석 뒤 공백 줄만 제거. 본문 HTML은 티스토리 붙여넣기용으로 그대로 보존합니다.
    if not body:
        raise ValueError(f"{path.name}: 본문이 비어 있습니다.")

    return {"title": title, "body": body, "tags": tags}


def infer_image_path(source_path: Path, explicit: str | None) -> Path | None:
    if explicit:
        candidate = Path(explicit).expanduser()
        if not candidate.is_absolute():
            candidate = ROOT / candidate
        return candidate if candidate.exists() else None

    base = source_path.stem
    if base.endswith("_티스토리"):
        base = base[: -len("_티스토리")]

    # 1) 같은 주제로 만든 사이트 글 slug가 있는 경우를 우선 매칭
    known = {
        "해외주식_양도소득세_250만원_공제": "foreign-stock-capital-gains-deduction",
    }
    candidates = []
    if base in known:
        candidates.append(THUMB_DIR / f"{known[base]}.webp")

    # 2) 원고명 자체와 같은 파일명도 허용
    candidates.extend(
        [
            THUMB_DIR / f"{base}.webp",
            THUMB_DIR / f"{base}.png",
            THUMB_DIR / f"{base}.jpg",
        ]
    )

    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def text_excerpt(body: str, limit: int = 160) -> str:
    text = P_TAG_TEXT_RE.sub(" ", body)
    text = html.unescape(re.sub(r"\s+", " ", text)).strip()
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def render_helper(title: str, body: str, tags: str, image_path: Path | None) -> str:
    image_abs = str(image_path) if image_path else ""
    image_name = image_path.name if image_path else "이미지 없음"
    preview_image = (
        f'<img src="{image_path.resolve().as_uri()}" alt="thumbnail preview">'
        if image_path
        else '<div class="no-image">연결된 썸네일이 없습니다.</div>'
    )

    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>티스토리 업로드 도우미 - {html.escape(title)}</title>
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif;
      background: #f8fafc;
      color: #111827;
      line-height: 1.7;
    }}
    header {{
      background: #111827;
      color: white;
      padding: 20px 24px;
    }}
    main {{
      max-width: 1040px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 20px;
    }}
    section {{
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 18px;
      margin-bottom: 16px;
    }}
    h1 {{ font-size: 20px; margin: 0 0 4px; }}
    h2 {{ font-size: 16px; margin: 0 0 12px; }}
    label {{ display: block; font-size: 13px; color: #6b7280; margin-bottom: 8px; }}
    textarea, input {{
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 12px;
      font: inherit;
      background: #f9fafb;
    }}
    textarea {{ min-height: 320px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }}
    button, a.button {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: 0;
      border-radius: 8px;
      padding: 10px 14px;
      background: #2563eb;
      color: white;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      margin: 8px 8px 0 0;
    }}
    button.secondary {{ background: #475569; }}
    .hint {{ color: #64748b; font-size: 13px; margin: 8px 0 0; }}
    .side img {{
      width: 100%;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      display: block;
    }}
    .no-image {{
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 28px 12px;
      text-align: center;
      color: #64748b;
    }}
    .checklist li {{ margin-bottom: 8px; }}
    @media (max-width: 860px) {{
      main {{ grid-template-columns: 1fr; padding: 16px; }}
    }}
  </style>
</head>
<body>
  <header>
    <h1>티스토리 업로드 도우미</h1>
    <div>{html.escape(text_excerpt(body))}</div>
  </header>
  <main>
    <div>
      <section>
        <h2>1. 제목</h2>
        <label>티스토리 제목 입력란에 붙여넣기</label>
        <input id="title" value="{html.escape(title)}">
        <button onclick="copyValue('title')">제목 복사</button>
      </section>

      <section>
        <h2>2. 본문 HTML</h2>
        <label>티스토리 에디터를 HTML 모드로 전환한 뒤 붙여넣기</label>
        <textarea id="body">{html.escape(body)}</textarea>
        <button onclick="copyValue('body')">본문 복사</button>
        <p class="hint">이미지는 티스토리에서 직접 업로드한 뒤 본문 상단에 배치하는 방식을 권장합니다.</p>
      </section>

      <section>
        <h2>3. 태그</h2>
        <label>티스토리 태그 입력란에 붙여넣기</label>
        <input id="tags" value="{html.escape(tags)}">
        <button onclick="copyValue('tags')">태그 복사</button>
      </section>
    </div>

    <aside class="side">
      <section>
        <h2>썸네일</h2>
        {preview_image}
        <label style="margin-top:12px">로컬 이미지 경로</label>
        <input id="imagePath" value="{html.escape(image_abs)}">
        <button onclick="copyValue('imagePath')">이미지 경로 복사</button>
        <p class="hint">{html.escape(image_name)}</p>
      </section>

      <section>
        <h2>업로드 순서</h2>
        <ol class="checklist">
          <li>티스토리 글쓰기 화면을 연다.</li>
          <li>제목을 복사해 입력한다.</li>
          <li>썸네일 이미지를 업로드하고 대표 이미지로 지정한다.</li>
          <li>에디터를 HTML 모드로 전환한다.</li>
          <li>본문 HTML을 붙여넣는다.</li>
          <li>태그를 붙여넣고 임시저장한다.</li>
        </ol>
        <a class="button" href="https://www.tistory.com/" target="_blank" rel="noopener">티스토리 열기</a>
      </section>
    </aside>
  </main>

  <script>
    async function copyValue(id) {{
      const el = document.getElementById(id);
      await navigator.clipboard.writeText(el.value);
      const old = document.title;
      document.title = '복사 완료';
      setTimeout(() => document.title = old, 900);
    }}
  </script>
</body>
</html>
"""


def write_package(source: Path, out_dir: Path, image_path: Path | None) -> Path:
    parsed = parse_tistory_post(source)
    out_dir.mkdir(parents=True, exist_ok=True)

    (out_dir / "title.txt").write_text(parsed["title"] + "\n", encoding="utf-8")
    (out_dir / "body.html").write_text(parsed["body"] + "\n", encoding="utf-8")
    (out_dir / "tags.txt").write_text(parsed["tags"] + "\n", encoding="utf-8")
    (out_dir / "image-path.txt").write_text(
        (str(image_path.resolve()) if image_path else "") + "\n",
        encoding="utf-8",
    )

    if image_path:
        shutil.copy2(image_path, out_dir / image_path.name)

    helper = render_helper(parsed["title"], parsed["body"], parsed["tags"], image_path)
    helper_path = out_dir / "upload-helper.html"
    helper_path.write_text(helper, encoding="utf-8")
    return helper_path


def main() -> int:
    parser = argparse.ArgumentParser(description="티스토리 업로드 준비 파일 생성")
    parser.add_argument("source", help="blog_post/*_티스토리.txt 경로")
    parser.add_argument("--slug", help="출력 폴더명")
    parser.add_argument("--image", help="첨부할 대표 이미지 경로")
    args = parser.parse_args()

    source = Path(args.source)
    if not source.is_absolute():
        source = ROOT / source
    if not source.exists():
        raise FileNotFoundError(source)

    slug = args.slug or slugify(source)
    out_dir = OUT_ROOT / slug
    image_path = infer_image_path(source, args.image)
    helper_path = write_package(source, out_dir, image_path)

    print(f"✓ 제목/본문/태그 분리 완료: {out_dir}")
    print(f"✓ 업로드 도우미: {helper_path}")
    if image_path:
        print(f"✓ 대표 이미지: {image_path}")
    else:
        print("! 대표 이미지를 찾지 못했습니다. --image 경로를 지정하세요.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
