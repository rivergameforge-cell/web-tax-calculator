# 고향사랑기부금 제작·검증 기록

2026-10-23 KST. 사용자 요청: 세금계산기 사이트·티스토리·네이버에 서로 다른 원고와 이미지 중심 썸네일을 작성·발행한다.

## 확인한 현행 근거

- 조세특례제한법 제58조: https://www.law.go.kr/법령/조세특례제한법/제58조 . 실제 조문: https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0058&lsiSeq=284389&urlMode=lsScJoRltInfoR . 시행2026-09-18. 국세 첫 구간100/110, 다음10만 원40%, 20만 원 초과 일반15%·적격 재난30%. 사업자인 거주자는 10만 원 초과분 필요경비 산입 등 별도 처리. 본문은 사업소득이 없는 일반 근로자로 한정했다.
- 행정안전부 2026-02-09: https://www.korea.kr/news/policyNewsView.do?newsId=148959263 . 2026-01-01부터 10만 원 초과~20만 원44%(지방세 포함), 적격 특별재난지역3개월·20만 원 초과33%, 답례품30%.
- 인천시 2026-10-01: https://www.incheon.go.kr/IC010101/view?curPage=1&nttNo=2046245 . 현행 구간·주소지 광역/기초 제한·연간2천만 원·기부경로.
- 서울시 2026-03-11: https://news.seoul.go.kr/gov/archives/572559 . 서울 중구 주민의 서울시·중구 제외 예시.
- 상주시: https://www.sangju.go.kr/page/16630/10427.tc . 20만 원 공제14만4천 원, 답례품6만 원. 본인만 공제, 결정세액에 따라 실제 적용액 변동, 이월공제 미적용.
- 동작구: https://www.dongjak.go.kr/portal/main/contents.do?menuNo=201702 . 개인별 지자체 합산 연간2천만 원.
- 국세청: https://www.nts.go.kr/nts/na/ntt/selectNttInfo.do?mi=2307&nttSn=1348133 . 본인이 지출한 고향사랑기부금만 공제. 해당 자료는2025귀속 세율이므로2026구간 근거로 사용하지 않았다.
- 국세청 간소화: https://www.nts.go.kr/nts/na/ntt/selectNttInfo.do?nttSn=1347979 . 전자기부금영수증에 고향사랑기부금 포함.2027서비스의 구체적인 개통일은 예측하지 않았다.
- 검색에 발견된2027 지방우대 세제개편안은2026 시행규정과 섞지 않았다. 지방세특례제한법167조는 관련 조문이 아니므로 근거에서 제외했다.

## 계산 및 편집 검수 기준

일반지역·적격기부·공제할 국세와 지방세 충분·사업소득 없는 근로자 가정. 금액 단위 원.
-100000: 공제100000·현금부담0·답례품한도30000
-150000: 공제122000·현금부담28000·답례품한도45000
-200000: 공제144000·현금부담56000·답례품한도60000
-300000: 공제160500·현금부담139500·답례품한도90000
추가10만 원 기부의 공제 증가44000·답례품한도 증가30000. 세목별 단수 처리와 실제 공제 적용순서는 실제 정산 확인.

js/calculators/income/employment.js의 donation 입력은 일반15%/30%만 지원한다. 세 플랫폼 CTA 모두 이번 기부금이나 공제액을 해당 칸에 넣지 말라고 명시했다. 계산기 기능은 변경하지 않는다.

만 원 띄어쓰기, 티스토리 독자용 법령·공식 링크 제외, 관련 글 마지막 배치. 티스토리·네이버 네이티브 카드와 본문·대표 이미지·태그·공개상태는 실제 발행 전후 검수. 완료 썸네일은 온라인을 보존하고 로컬 작업 폴더만 정리.

## 썸네일

기본 내장 image_gen으로 세 이미지를 각각 생성했다. 승인된 ISA v2처럼 입체 일러스트·큰 문구·강한 대비를 사용하고 설명 카드·표를 배제했다. 최종 자산: thumbnails/gohyang-donation-tax-credit.webp, thumbnails/gohyang-donation-tax-credit-tistory.webp, thumbnails/gohyang-donation-tax-credit-naver.webp . 원본은 .codex/generated_images에 보존하고 WebP 크기·인코딩을 맞춘다.

## 최종 생성 프롬프트

### site

Use case: ads-marketing. Asset: professional Korean tax blog OG thumbnail, wide 1200x630 composition. Create a premium illustrated finance thumbnail: a beautifully rendered opened emerald green gift box with a gold ribbon, a few gold won coins and a small Korean countryside landscape motif behind it, deep teal and navy background, cinematic warm gold lighting, rich dimensional 3D editorial illustration. Large cohesive subject on the right half, exceptionally big, bold Korean sans serif headline on the left half. Exact text only, three short lines: '고향사랑기부금' / '10만 원 vs 20만 원' / '세금 혜택 비교'. The middle line is the largest, white and gold typography with dark shadow. All words use the exact spaces given. Keep text and important objects within 85% central safe area. Looks compelling and immediately recognizable at 160px. No tables, no boxes containing explanations, no comparison cards, no small print, no watermarks, no logos, no additional text, no promises of guaranteed refund.

### tistory

Use case: ads-marketing. Asset: Korean personal finance Tistory thumbnail, square 1080x1080 composition. Premium cinematic 3D editorial illustration: a large elegant red gift box with warm golden ribbon, shiny gold won coins beside a simple blue tax receipt sheet carrying a large clean question mark, against deep charcoal navy, golden rim light and rich contrast. Illustration fills upper half; lower middle holds exceptionally large heavy Korean sans serif typography, dimensional gold and white letters with crisp dark outline. Exact headline only in three lines: '고향사랑기부금' / '20만 원 기부' / '얼마 돌려받나?'. Make the second and third lines much larger than the short topic line; keep all within central 80% safe area. Clear subject and readable type when viewed at 150px wide. No text cards, no tables, no explanatory panels, no small print, no official seal or logo, no watermarks, no extra wording. This is a question, do not imply everyone receives a full cash refund.

### naver

Use case: ads-marketing. Asset: Korean Naver finance blog thumbnail, wide 5:3 1200x720 composition. A polished inviting dimensional illustration of a cream gift basket with apples and a neatly tied local rice gift bag, a few subtle gold won coins, warm afternoon light on a walnut table, blurred green countryside visible behind. Deep forest green and cream palette with warm peach highlights, sophisticated friendly rendered illustration, strong contrast. On the left, huge bold clean Korean sans serif text in exactly three lines: '고향사랑기부' / '기부도 하고' / '답례품도 받고'. First line small but bold, final two lines exceptionally large cream and golden yellow with dark green shadow, no small print. Main subject basket on right. Keep headline and main subject inside central 90% safe area, legible at 160px. No text cards, no tables, no checklist, no explanation panels, no logos or watermark, no other lettering on bags, no guaranteed profit or refund claims.
