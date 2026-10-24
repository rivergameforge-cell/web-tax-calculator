# 연금계좌 손실 세액공제 발행 완료 기록

2026-10-24 KST. 같은 주제의 서로 다른 원고와 일러스트 썸네일을 세 플랫폼에 공개 발행하고 실제 브라우저 화면을 확인했다.

## 완료

- 사이트: https://taxcalc.co.kr/blog/pension-loss-tax-credit.html
- 티스토리: https://kwonriver-carstroy.tistory.com/entry/pensionlosstaxcredit2026 (글 번호 1046)
- 네이버: https://blog.naver.com/kwonriver_car/224452099645
- 배포 커밋: `bcf1433504b0b5db7159de5f7af3698c6bda14aa`. GitHub Pages 빌드 `built`, 오류 없음, 실제 사이트 제목·날짜·본문 확인.
- 네이버는 돈 버는 생각 카테고리·비즈니스·경제 주제·전체공개로 발행. 태그 25개를 발행창에 등록하고 공개 결과 확인.
- 네이버 본문의 원고 주요 문장이 모두 보존됐는지 공백·제로폭 문자를 제외해 비교했다. 썸네일 정상 로드 및 5:3 비율 확인.
- 네이버 관련 글은 224451641885(ISA 만기), 224451733382(고향사랑기부금)를 URL+Enter로 각각 네이티브 카드 생성. 공개 화면의 제목·요약·이미지를 확인했다.
- 기존 Python 테스트 43개 통과. 별도로 6개 금액 계산·만 원 표기·티스토리 광고 2개의 H2 직후 위치·네이버 태그 수·사이트 날짜·관련 글 매핑·diff 공백 확인 완료.
- 티스토리 발행 주소는 영문 소문자·숫자만 쓰도록 AGENTS.md와 개인 스킬에 사용자 지시를 반영했다.

## 티스토리 발행 검수

돈 버는 생각 카테고리·경제 주제·현재 시각·공개로 발행했다. 모드 전환 확인창은 사용자 조작으로 닫았고 이후 입력과 발행을 마쳤다.

- 제목: 연금저축 600만 원 넣고 100만 원 손실, 세액공제 99만 원도 줄어들까?
- 원고와 입력 패키지: `tistory_upload/연금저축_IRP_손실_세액공제_납입액_기준/`. 태그 10개 입력 확인.
- 업로드 이미지: `thumbnails/pension-loss-tax-credit-tistory.webp` (1080×1080). 본문 이미지·별도 대표 이미지·공개 OG 이미지가 모두 새 일러스트이며 CDN 식별자 BD0eg가 일치한다. 발행창 170px 대표 이미지에서도 문구와 피사체를 확인했다.
- 글 주소 식별자: `pensionlosstaxcredit2026`. 실제 공개 URL과 canonical의 끝부분이 모두 영문 소문자·숫자로만 구성됨을 확인했다. canonical: https://kwonriver.co.kr/entry/pensionlosstaxcredit2026 .
- 서론 두 문단→이미지→H2/본문 순서를 DOM으로 확인했다. 이미지 naturalWidth·naturalHeight는 각각 1080이다.
- 수동 광고 슬롯 4883327520은 H2 직후 2개. 공개 본문에서도 같은 슬롯 두 개를 확인했다.
- 법령·국세청·금융위 등 공식 근거 링크가 독자용 본문에 없음을 확인했다. 근거는 research.md에 보관한다.
- 관련 글 1043(ISA 만기), 1029(퇴사 후 연말정산)를 공개 확인 후 URL+Enter로 각각 네이티브 카드를 생성했다. 공개 글에서 두 카드의 제목·요약·이미지를 확인했다.
- 이미지·카드 편집 후 본문을 원고와 비교했다. 이미지·광고·관련 글 카드 영역을 제외하고 공백·제로폭 문자를 정규화한 주요 본문이 일치했다.
- 발행 완료 썸네일 세 개 모두 로컬 작업 폴더에서만 정리했다. 복구 커밋·blob·SHA256은 저장소 밖 manifest에 보관했다.

## 자료·증빙

공식 근거·검산·이미지 원본 위치·생성 방식: [research.md](research.md).
내장 image_gen의 최종 생성 프롬프트 세트: [prompts.json](prompts.json).

배포 자산:

- https://taxcalc.co.kr/thumbnails/pension-loss-tax-credit.webp
- https://taxcalc.co.kr/thumbnails/pension-loss-tax-credit-tistory.webp
- https://taxcalc.co.kr/thumbnails/pension-loss-tax-credit-naver.webp

업로드 완료 WebP 세 개를 로컬 thumbnails 폴더에서만 정리했다. 모든 Git·배포·CDN 이미지는 보존했다. 기존 정리 자산을 포함해 100개 이미지 경로가 Git skip-worktree로 의도적으로 로컬에만 없는 상태다.

복구 기록과 실제 브라우저 증빙은 저장소 밖에 보관한다:

`C:/Users/Kwonriver/Desktop/AIGen/sub_job/web_tax_calc/output/pension-loss/`

- `thumbnail-cleanup-manifest.json`
- `site-published.png`
- `tistory-published.png`
- `tistory-related-cards.png`
- `tistory-editor.html`
- `naver-published.png`
- `naver-related-cards.png`
