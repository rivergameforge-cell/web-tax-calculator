# 연금계좌 손실 세액공제 발행 진행 기록

2026-10-24 KST. 사용자 요청: 같은 주제의 서로 다른 원고와 일러스트 썸네일을 세 플랫폼에 공개 발행.

## 완료

- 사이트: https://taxcalc.co.kr/blog/pension-loss-tax-credit.html
- 네이버: https://blog.naver.com/kwonriver_car/224452099645
- 배포 커밋: `bcf1433504b0b5db7159de5f7af3698c6bda14aa`. GitHub Pages 빌드 `built`, 오류 없음, 실제 사이트 제목·날짜·본문 확인.
- 네이버는 돈 버는 생각 카테고리·비즈니스·경제 주제·전체공개로 발행. 태그 25개를 발행창에 등록하고 공개 결과 확인.
- 네이버 본문의 원고 주요 문장이 모두 보존됐는지 공백·제로폭 문자를 제외해 비교했다. 썸네일 정상 로드 및 5:3 비율 확인.
- 네이버 관련 글은 224451641885(ISA 만기), 224451733382(고향사랑기부금)를 URL+Enter로 각각 네이티브 카드 생성. 공개 화면의 제목·요약·이미지를 확인했다.
- 기존 Python 테스트 43개 통과. 별도로 6개 금액 계산·만 원 표기·티스토리 광고 2개의 H2 직후 위치·네이버 태그 수·사이트 날짜·관련 글 매핑·diff 공백 확인 완료.
- 티스토리 발행 주소는 영문 소문자·숫자만 쓰도록 AGENTS.md와 개인 스킬에 사용자 지시를 반영했다.

## 티스토리 남은 작업

새 글의 HTML 모드 전환 확인창을 사용자에게 닫아 달라고 요청한 상태다. 브라우저 도구의 클릭은 Emulation focus 시간 초과로 실패한다. 아직 새 연금 글을 티스토리에 발행하지 않았다.

- 준비 제목: 연금저축 600만 원 넣고 100만 원 손실, 세액공제 99만 원도 줄어들까?
- 새 글 탭: Chrome 프로필 가람, 탭 ID 2018347064.
- 모드 확인 후 입력할 본문: `tistory_upload/연금저축_IRP_손실_세액공제_납입액_기준/body.html`
- 태그 10개: 같은 폴더 `tags.txt`.
- 업로드할 이미지: `thumbnails/pension-loss-tax-credit-tistory.webp` (1080×1080).
- 글 주소 식별자: `pensionlosstaxcredit2026` (하이픈 포함 모든 특수문자 제외).
- 서론→이미지→H2/본문 순서, H2 직후 수동 광고 2개, 법령·공식 근거 링크 제외.
- 관련 글 1043(ISA 만기), 1029(퇴사 후 연말정산)를 공개 확인 후 네이티브 카드로 넣어야 한다. 아직 이 새 글에 카드를 생성하지 않았다.
- 공개 발행 후 대표 이미지·본문·태그·카드·실제 URL 확인, 이 기록을 완료 상태로 갱신, 남은 티스토리 썸네일을 로컬에서만 정리한다.

## 자료·증빙

공식 근거·검산·이미지 원본 위치·생성 방식: [research.md](research.md).
내장 image_gen의 최종 생성 프롬프트 세트: [prompts.json](prompts.json).

배포 자산:

- https://taxcalc.co.kr/thumbnails/pension-loss-tax-credit.webp
- https://taxcalc.co.kr/thumbnails/pension-loss-tax-credit-tistory.webp
- https://taxcalc.co.kr/thumbnails/pension-loss-tax-credit-naver.webp

사이트·네이버 업로드 완료 WebP 두 개만 로컬 thumbnails 폴더에서 정리한다. 티스토리용 WebP는 업로드 전이므로 보존한다. 모든 Git·배포·CDN 이미지는 보존한다.

복구 기록과 실제 브라우저 증빙은 저장소 밖에 보관한다:

`C:/Users/Kwonriver/Desktop/AIGen/sub_job/web_tax_calc/output/pension-loss/`

- `thumbnail-cleanup-manifest.json`
- `site-published.png`
- `naver-published.png`
- `naver-related-cards.png`
