# 한국 세금 계산기 — Claude 작업 가이드

## 프로젝트 개요
한국 주요 세금을 계산할 수 있는 **Vanilla HTML/CSS/JS SPA**입니다.
빌드 도구 없이 `python3 -m http.server 8080`으로 바로 실행됩니다.

---

## 기술 스택 & 제약사항

| 항목 | 내용 |
|------|------|
| 언어 | HTML5 / CSS3 / JavaScript ES6+ |
| 프레임워크 | **없음** (Vanilla만 사용) |
| 빌드 도구 | **없음** — `<script src="...?v=N">` 캐시버스팅만 사용 |
| 폰트 | Pretendard CDN + 시스템 폰트 fallback |
| 로컬 서버 | `python3 -m http.server 8080` |

---

## 디렉터리 구조

```
web_tex_calculator/
├── index.html                          # 단일 SPA 진입점, 모든 뷰 포함
├── css/
│   ├── reset.css                       # 브라우저 reset
│   ├── variables.css                   # CSS Custom Properties (라이트/다크)
│   ├── layout.css                      # 앱 셸, 헤더, 사이드바, 탭바
│   ├── components.css                  # 카드, 폼, 인풋, 버튼, 배지
│   ├── calculator.css                  # 계산기 전용 스타일
│   └── responsive.css                  # 반응형 브레이크포인트
├── js/
│   ├── theme.js                        # 라이트/다크 모드 토글
│   ├── ui.js                           # fmtWon, toast, debounce 등 유틸
│   ├── router.js                       # 해시 기반 라우터
│   ├── ads.js                          # 전면광고(Page Visibility), 앵커광고
│   ├── app.js                          # NAV_CONFIG, TAB_CONFIG, 사이드바 빌드
│   └── calculators/
│       ├── loan/
│       │   └── loan.js
│       ├── real-estate/
│       │   ├── acquisition.js
│       │   ├── capital-gains.js
│       │   └── commission.js
│       ├── vehicle/
│       │   └── vehicle-tax.js
│       └── stocks/
│           ├── foreign.js
│           └── transaction.js
└── .claude/
    └── launch.json                     # 로컬 서버 자동 실행 설정
```

---

## 새 계산기 추가 시 체크리스트

1. **`js/app.js`** — `NAV_CONFIG`와 `TAB_CONFIG`에 항목 추가
2. **`js/calculators/<category>/<name>.js`** — 계산기 모듈 생성
   - 파일 맨 아래 `const Calc<Name> = (() => { ... return { init }; })();` 패턴 사용
3. **`index.html`** — 두 곳 수정
   - `<div id="view-<category>-<name>" class="calculator-view">` 뷰 HTML 추가
   - `<script src="js/calculators/<category>/<name>.js?v=N">` 스크립트 태그 추가
   - `DOMContentLoaded` 블록에 `Calc<Name>.init();` 추가
4. **캐시버스팅** — 스크립트 수정 시 `?v=N` 숫자 올리기

---

## 계산기 모듈 템플릿

```js
const CalcExample = (() => {
  function calculate() {
    // 세금 계산 로직
  }

  function render(result) {
    // DOM 업데이트
  }

  function init() {
    const btn = document.getElementById('btn-example-calc');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const result = calculate();
      render(result);
    });
  }

  return { init };
})();
```

---

## 라우팅 규칙

- URL 해시 형식: `#<category>/<item>` (예: `#real-estate/acquisition`)
- 카테고리 ID: `loan` / `real-estate` / `vehicle` / `income` / `stocks` / `other`
- 뷰 요소 ID: `view-<category>-<item>` (슬래시 → 하이픈, 예: `view-real-estate-acquisition`)

---

## 세율 기준년도

**모든 세율은 2026년 기준**입니다. 세율 변경 시 해당 계산기 파일의 상수만 수정하면 됩니다.

---

## 광고 슬롯 구조

| 슬롯 | 위치 | 크기 | 비고 |
|------|------|------|------|
| 좌측 사이드 | 사이드바 하단 sticky | 160×600 | 1440px+ 표시 |
| 우측 사이드 | 메인 우측 sticky | 160×600 | 1440px+ 표시 |
| 배너 | 탭바와 계산기 패널 사이 | 728×90 | 데스크톱 |
| 앵커 | 화면 하단 고정 | 320×50 | 모바일 |
| 전면 | 외부링크 복귀 시 오버레이 | — | Page Visibility API |

---

## 반응형 브레이크포인트

| 범위 | 설명 |
|------|------|
| < 640px | 모바일 — 햄버거 메뉴, 하단 앵커광고 |
| 640–1023px | 태블릿 |
| 1024px+ | 데스크톱 — 사이드바 고정 표시 |
| 1440px+ | 사이드 광고 표시 |

---

## 주의사항

- `position: fixed`는 카카오/라인 인앱 브라우저에서 버그 발생 → `position: sticky` 사용
- CSS 변수는 `variables.css`에서만 정의, 다크모드는 `[data-theme="dark"]` 셀렉터로 override
- 계산 결과에 사용되는 숫자는 반드시 `UI.fmtWon()` 또는 `UI.fmtNum()`으로 포맷팅
