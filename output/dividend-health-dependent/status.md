# 배당금과 건강보험 피부양자 제작 상태

기록일: 2026-10-25.

- 사이트 발행: https://taxcalc.co.kr/blog/dividend-health-insurance-dependent.html
- 배포 커밋: b40487e977183aab56a416d07d4312d3e49501fb. GitHub Pages 실행 40158773175 성공. 공개 HTML 및 썸네일 3종은 HTTP 200과 로컬 파일 SHA256 일치를 확인.
- 네이버: kwonriver_car 새 글에 전용 원고, 서론 뒤 대표 이미지, 계산기 카드 1개와 관련 글 카드 2개, 태그 24개를 입력하고 임시저장. 목록의 임시저장 개수가 3개에서 4개로 증가. 본문의 공백 제거 비교가 원고와 정확히 일치하며, 모든 카드 이미지가 로드됨. 최종 발행하지 않음.
- 티스토리: 제목·카테고리 ‘돈 버는 생각’·태그 10개, 서론 뒤 직접 업로드한 1080×1080 썸네일과 native 관련 글 카드 1개를 확인. HTML 모드에서 수동 광고 2개를 복구하여 각각 소제목 바로 뒤·본문 앞에 배치했고, 미리보기 DOM에서도 두 ins 태그와 위치를 확인. 관련 카드의 복수 이미지 URL을 단일 URL로 정리해 썸네일 표시를 확인. 본문 썸네일 로드와 별도 대표 이미지 설정, 375px 모바일 미리보기의 문단 간격·카드 표시를 확인한 뒤 임시저장 완료(임시저장 개수 1→2, 이후 같은 초안 재저장). 최종 발행하지 않음.
- 티스토리 발행 시 예정 주소: dividendhealthdependent2026 (ASCII 소문자·숫자만). 실제 발행 URL은 아직 없음.

검증: 기존 테스트 43개 통과. 과거 네이버 해시 주소를 요구하던 테스트 6개의 기대값만 사용자 지시에 맞는 canonical HTML 주소로 정정. 새 원고 금액 띄어쓰기, 플랫폼별 관련 글, 티스토리 수동 광고 2개 위치, 네이버 출처 없음·태그 24개, 이미지 크기를 확인.

내장 image_gen으로 썸네일 3종을 제작. 프롬프트와 최종 자산 이름은 prompts.json에 보관. 배포된 썸네일은 인터넷·Git에 보존하고 로컬 thumbnails/에서만 정리. 복원용 커밋·Git blob·SHA256과 실제 절대경로는 저장소 밖 thumbnail-cleanup-manifest.json에 보관.

브라우저 이어서 작업: 티스토리 Chrome 3 탭 2018347171, 네이버 Chrome 4 탭 2018347174. 두 플랫폼 모두 초안 저장과 화면 검수를 완료. 공개 발행은 별도 사용자 확인 후 진행. 티스토리의 실제 저장 HTML은 아래 tistory-saved-html.html을 참조.

외부 작업 기록: C:/Users/Kwonriver/Desktop/AIGen/sub_job/web_tax_calc/output/dividend-health-dependent/

- tistory-saved-html.html: 편집기에서 읽어 검증한 최종 저장 HTML(광고 2개·이미지 shortcode 1개·native 카드 1개)
- tistory-draft-check.json: 최종 HTML의 광고·배치·이미지·카드 검증
- tistory-preview-check.json: 미리보기 DOM의 광고 위치와 이미지 로드 검증
- tistory-ready-settings.png: 대표 이미지 및 특수문자 없는 주소 설정 화면
- tistory-mobile-preview.png / tistory-mobile-related-card.png: 모바일 미리보기와 관련 카드 표시
- naver-draft-check.json: 원문·카드·대표 이미지 검증
- naver-draft-thumbnail.png: 네이버 대표 이미지 화면
- site-live.png: 사이트 공개 모바일 화면
- live-check.json: 공개 HTML·이미지 해시 검증
- thumbnail-cleanup-manifest.json: 로컬 이미지 복원 정보
