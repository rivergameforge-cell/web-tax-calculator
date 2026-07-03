# 정적 페이지 빌드 시스템

각 계산기의 SEO/AdSense용 정적 HTML 페이지를 생성하는 파이프라인입니다.

## 구조

```
build/
├── content/                  # 페이지 콘텐츠 (JSON frontmatter + HTML 본문)
│   ├── real-estate-acquisition.html
│   ├── income-salary.html
│   └── ...
├── templates/
│   └── calculator-page.html  # 공통 템플릿 (플레이스홀더 치환 방식)
├── build.py                  # 빌더 (Python 표준 라이브러리만 사용)
└── README.md
```

## 사용법

```bash
python3 build/build.py
```

실행 시:
1. `build/content/*.html` 전부 파싱
2. 각 페이지를 `{route_id}.html` 로 프로젝트 루트에 출력
   - 예: `real-estate/acquisition` → `/real-estate/acquisition.html`
3. `sitemap.xml` 도 동시 갱신

## 콘텐츠 파일 형식

파일명: 라우트 id 에서 슬래시를 하이픈으로 치환 (예: `real-estate-acquisition.html`)

```
---
{
  "id": "real-estate/acquisition",
  "title": "취득세 계산기",
  "metaTitle": "취득세 계산기 2026 | 주택 취득세율표 | 세금계산기",
  "metaDescription": "2026년 최신 주택 취득세 세율로 즉시 계산...",
  "keywords": ["취득세", "취득세 계산기", "주택 취득세"],
  "lead": "취득세 개요 한 문장 소개(페이지 상단 리드 문장)",
  "related": ["real-estate/registration", "real-estate/stamp"],
  "priority": "0.9",
  "changefreq": "monthly"
}
---
<h2>취득세란?</h2>
<p>...</p>
```

### 필수 필드
- `id`: 라우트 (예: `real-estate/acquisition`)
- `title`: 페이지 제목 (H1 및 버튼에 사용)
- `metaTitle`: `<title>` / OG 용 — 50~60자 권장
- `metaDescription`: `<meta description>` / OG 용 — 120~160자 권장
- `lead`: H1 아래 리드 문장 1~2줄

### 선택 필드
- `keywords`: 배열 → 쉼표 결합되어 meta keywords 로
- `related`: 관련 계산기 route id 배열
- `priority`: sitemap 우선순위 (기본 `0.8`)
- `changefreq`: sitemap 업데이트 주기 (기본 `monthly`)

## 본문 작성 가이드

- HTML 직접 작성 (마크다운 아님)
- 권장 구성:
  1. `<h2>개요/소개</h2>` — 세금이 무엇인지, 누가 납부하는지
  2. `<h2>2026년 세율</h2>` — 표(`<table>`) 활용
  3. `<h2>계산 방법</h2>` — 단계별 설명
  4. `<h2>자주 묻는 질문</h2>` — `<details>` 반복
  5. (선택) `<h2>절세 팁</h2>`
- 최소 길이: 고유 텍스트 800자 이상 (AdSense 품질 기준)

## 출력 URL

- `https://taxcalc.co.kr/real-estate/acquisition.html` 등
- SPA 계산기는 `/#real-estate/acquisition` 로 이전처럼 동작
- 정적 페이지에 "계산기 실행" 버튼 → SPA로 연결

## 티스토리 업로드 준비

티스토리 Open API 종료로 자동 API 발행 대신, `blog_post/*_티스토리.txt` 원고를
제목/본문/태그/대표 이미지로 분리하는 로컬 업로드 도우미를 사용합니다.

```bash
python3 build/tistory_prepare.py blog_post/해외주식_양도소득세_250만원_공제_티스토리.txt
```

실행 시 `tistory_upload/<글이름>/` 아래에 다음 파일이 생성됩니다.

- `title.txt`: 티스토리 제목 입력란용
- `body.html`: HTML 모드 본문 붙여넣기용
- `tags.txt`: 태그 입력란용
- `image-path.txt`: 대표 이미지 로컬 경로
- `upload-helper.html`: 브라우저에서 열어 복사 버튼으로 업로드 준비

대표 이미지는 `thumbnails/*.webp`에서 자동 추정하며, 다른 이미지를 쓰려면
`--image <경로>`를 지정합니다.
