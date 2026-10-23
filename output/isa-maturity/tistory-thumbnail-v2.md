# 티스토리 ISA 썸네일 교체

2026-10-23. 사용자가 기존 썸네일의 품질 문제를 지적했다. 설명이 많은 텍스트 카드를 대표 썸네일로 사용해 기존 블로그의 이미지 중심 스타일과 맞지 않았으며, 작은 목록에서 글씨가 읽히지 않았다.

기본 내장 이미지 생성 도구(image_gen)를 사용해 새 이미지를 제작했다. CLI/API 대체 경로는 사용하지 않았다. 생성 이미지는 1080×1080 WebP로 크기·인코딩만 변환했다.

- 최종 배포 자산: thumbnails/isa-maturity-renewal-rejoin-tistory-v2.webp
- 배포 URL: https://taxcalc.co.kr/thumbnails/isa-maturity-renewal-rejoin-tistory-v2.webp
- 문구: “ISA 3년 / 해지할까? / 만기·연장·재가입”
- 대상: 티스토리 게시글 1043의 본문 이미지와 별도 대표 이미지 지정
- 기존 텍스트·광고 2개·관련 글 카드 2개는 이미지 교체 전후 HTML 비교로 보존 확인했다.
- 완료 이미지는 업로드·공개 확인 후 로컬 thumbnails/에서만 정리하고 Git 배포 자산과 CDN은 보존한다.

## 최종 생성 프롬프트

Use case: ads-marketing. Asset: Korean personal finance Tistory blog thumbnail, square 1:1, 1080x1080 final composition. Create a polished, striking illustrated editorial thumbnail that reads immediately when reduced to 150px. Dark charcoal / deep navy backdrop, cinematic warm golden light, richly rendered 3D calendar showing a huge numeral 3, a simple premium blue account folder marked ISA, a few gold coins, and two contrasting directional arrows suggesting a choice to extend or close an account. These objects are a clear, cohesive main visual in the upper half, no UI screenshot, no tables, no explanation panels. Make it feel like a professional Korean finance blog thumbnail, bold and dimensional with very crisp type. Exact headline text only: first line 'ISA 3년', second line '해지할까?' in exceptionally large, heavy Korean sans-serif lettering. First line white, second line vibrant golden yellow, clean dark outline and restrained shadow, centered across the lower middle. A small but clearly readable final line '만기·연장·재가입' below it. Keep all text within the central 80% safe area, and the large headline within a compact block so square and modest landscape crops remain legible. No extra wording, no fine print, no labels such as Tistory, no invented brand, no logos, no watermarks. This is a question and must not visually claim that everyone must close an ISA at three years. Prioritize the short headline, visual hierarchy, clean spacing, and legibility.
