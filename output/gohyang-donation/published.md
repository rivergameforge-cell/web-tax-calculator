# 고향사랑기부금 발행 완료 기록

2026-10-23 KST. 세 플랫폼 공개 발행 및 실제 브라우저 화면 확인 완료.

## 공개 글

| 플랫폼 | 제목 | 공개 URL |
|---|---|---|
| 세금계산기 | 고향사랑기부금 세액공제 계산, 2026년 10만 원·20만 원 실제 부담 비교 | https://taxcalc.co.kr/blog/gohyang-donation-tax-credit.html |
| 티스토리 | 고향사랑기부금 20만 원 내면 얼마 환급? 답례품 6만 원과 구분하세요 | https://kwonriver-carstroy.tistory.com/1044 |
| 네이버 | 고향사랑기부금, 10만 원만 할까요? 20만 원과 답례품까지 비교해 봤어요 | https://blog.naver.com/kwonriver_car/224451733382 |

사이트 배포 커밋: `5eb97864f4b8890313719b2a0d188f78b7cd4c10`. GitHub Pages 최신 빌드가 해당 커밋의 `built` 상태임을 확인했다.

## 발행 검수

- 공식 법령·행정안전부·지방자치단체 자료로 2026년 적용 구간을 확인했다. 상세 근거와 최종 이미지 생성 프롬프트는 [research.md](research.md)에 보관했다.
- 일반지역, 사업소득 없는 근로자, 공제 가능한 국세·지방세 충분이라는 계산 전제를 명시했다. 10만 원·15만 원·20만 원·30만 원 사례를 별도로 검산했다.
- 세액공제와 답례품을 현금 환급으로 합산하지 않았다. 세액 부족·이월 불가·주소지 제한·본인 명의·사업소득자 별도 규정을 설명했다.
- 현재 근로소득세 계산기의 일반 기부금 입력란은 고향사랑기부금 구간을 지원하지 않으므로 이번 기부금이나 공제액을 해당 칸에 입력하지 않도록 세 글에서 안내했다.
- 제목·도입·문체·예시·CTA와 이미지 콘셉트를 플랫폼마다 구분했다. 독자용 금액은 `만 원`으로 표기했다.
- 티스토리: 공개 글 1044, 돈 버는 생각 카테고리, 경제 주제, 태그 10개. 서론 다음 썸네일, H2 직후 수동 광고 2개, 빈 문단 간격을 확인했다. 본문 및 별도 대표 이미지가 새 썸네일이며, 공식 근거·법령 링크는 독자용 본문에 넣지 않았다.
- 티스토리 마지막 관련 글: 1034(청년 소득세 감면), 1029(퇴사 후 연말정산). 두 카드의 제목·요약·이미지를 공개 화면에서 확인했다. 원고와 업로드 패키지도 실제 사용한 숫자 URL로 맞췄다.
- 네이버: 공개 글 224451733382, 돈 버는 생각 카테고리, 비즈니스·경제 주제, 태그 25개. 이미지와 짧은 문단을 확인했다. 첫 관련 글 URL의 설명 문단 합침을 정리한 후 같은 글 번호로 수정 발행했다.
- 네이버 마지막 관련 글: 224450608687(중소기업 소득세 감면), 224447324451(맞벌이 청약통장). 두 카드의 제목·요약·이미지를 공개 화면에서 확인했다.
- 편집 과정에서 본문 주요 내용이 보존되었는지 비교했다. 네이버는 공백·제로폭 문자를 제외한 본문 비교가 일치했다.
- 기존 Python 테스트 43개 통과. 추가로 계산·금액 표기·태그 수·티스토리 광고 위치·사이트 날짜를 점검했고 `git diff --check`를 통과했다.

## 썸네일 제작과 보관

기본 내장 `image_gen` 도구로 각각 생성했다. 설명용 텍스트 카드나 표 대신 입체 일러스트와 짧고 큰 문구를 사용했다. 최종 프롬프트 세 개는 [research.md](research.md)의 `최종 생성 프롬프트`에 기록했다. Pillow는 크기·비율 보존 및 WebP 인코딩에만 사용했다.

| 플랫폼 | 배포된 자산 | 크기 | 바이트 |
|---|---|---|---|
| 사이트 | https://taxcalc.co.kr/thumbnails/gohyang-donation-tax-credit.webp | 1200×630 | 212612 |
| 티스토리 | https://taxcalc.co.kr/thumbnails/gohyang-donation-tax-credit-tistory.webp | 1080×1080 | 278008 |
| 네이버 | https://taxcalc.co.kr/thumbnails/gohyang-donation-tax-credit-naver.webp | 1200×720 | 206960 |

원본 PNG 보존 위치:

- `C:/Users/Kwonriver/.codex/generated_images/01a15455-71fc-73c2-9db7-695a6401de5d/exec-9eb56097-6a7e-48fd-b5c5-cfa1f7adc9c4.png`
- `C:/Users/Kwonriver/.codex/generated_images/01a15455-71fc-73c2-9db7-695a6401de5d/exec-55039e17-5728-4693-80d7-0e2db4fe87a1.png`
- `C:/Users/Kwonriver/.codex/generated_images/01a15455-71fc-73c2-9db7-695a6401de5d/exec-a9a388dc-bfad-420b-9237-5e18b3a698f3.png`

업로드 완료 WebP는 사용자 지시에 따라 저장소의 로컬 `thumbnails/` 작업 폴더에서만 정리한다. Git·배포 자산·블로그 CDN 이미지는 보존한다. 로컬 정리 시 경로·복원 커밋·Git blob·SHA256을 저장소 밖의 다음 기록에 저장한다.

`C:/Users/Kwonriver/Desktop/AIGen/sub_job/web_tax_calc/output/gohyang-donation/thumbnail-cleanup-manifest.json`

공개 화면 증빙 PNG 위치:

`C:/Users/Kwonriver/Desktop/AIGen/sub_job/web_tax_calc/output/gohyang-donation/`

- `site-published.png`
- `tistory-published.png`
- `tistory-related-cards.png`
- `naver-published.png`
