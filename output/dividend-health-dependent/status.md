# 배당금과 건강보험 피부양자 제작 상태

기록일: 2026-10-25.

- 사이트 발행: https://taxcalc.co.kr/blog/dividend-health-insurance-dependent.html
- 배포 커밋: b40487e977183aab56a416d07d4312d3e49501fb. GitHub Pages 실행 40158773175 성공. 공개 HTML 및 썸네일 3종은 HTTP 200과 로컬 파일 SHA256 일치를 확인.
- 네이버: kwonriver_car 새 글에 전용 원고, 서론 뒤 대표 이미지, 계산기 카드 1개와 관련 글 카드 2개, 태그 24개를 입력하고 임시저장. 목록의 임시저장 개수가 3개에서 4개로 증가. 본문의 공백 제거 비교가 원고와 정확히 일치하며, 모든 카드 이미지가 로드됨. 최종 발행하지 않음.
- 티스토리: 제목·카테고리 ‘돈 버는 생각’·태그 10개 입력. 썸네일은 직접 업로드했고 서론 뒤에 배치, 관련 글은 native OpenGraph 카드 생성. 기본모드의 전체 붙여넣기 과정에서 광고의 ins 태그가 제거되어 HTML에서 복구해야 함. 복구할 완성 HTML은 저장소 밖 tistory-final-html.html에 보관. HTML 모드 전환 확인창을 도구로 처리하면 Emulation.setFocusEmulationEnabled 시간 초과가 발생하여 사용자에게 닫기를 요청한 상태. 최종 임시저장/광고 복구 완료로 보고하지 않음. 최종 발행하지 않음.
- 티스토리 발행 시 예정 주소: dividendhealthdependent2026 (ASCII 소문자·숫자만). 실제 발행 URL은 아직 없음.

검증: 기존 테스트 43개 통과. 과거 네이버 해시 주소를 요구하던 테스트 6개의 기대값만 사용자 지시에 맞는 canonical HTML 주소로 정정. 새 원고 금액 띄어쓰기, 플랫폼별 관련 글, 티스토리 수동 광고 2개 위치, 네이버 출처 없음·태그 24개, 이미지 크기를 확인.

내장 image_gen으로 썸네일 3종을 제작. 프롬프트와 최종 자산 이름은 prompts.json에 보관. 배포된 썸네일은 인터넷·Git에 보존하고 로컬 thumbnails/에서만 정리. 복원용 커밋·Git blob·SHA256과 실제 절대경로는 저장소 밖 thumbnail-cleanup-manifest.json에 보관.

브라우저 이어서 작업: 티스토리 Chrome 3 탭 2018347171, 네이버 Chrome 4 탭 2018347174. 티스토리 확인창이 닫히면 준비 HTML을 CodeMirror에 붙여넣고, 광고 2개 및 카드·썸네일을 확인한 뒤 임시저장할 것. 공개 발행은 별도 사용자 확인 후 진행.

외부 작업 기록: C:/Users/Kwonriver/Desktop/AIGen/sub_job/web_tax_calc/output/dividend-health-dependent/

- tistory-final-html.html: 광고 2개 + 직접 업로드한 이미지 + native 관련 글 카드를 통합한 복구 원고
- naver-draft-check.json: 원문·카드·대표 이미지 검증
- naver-draft-thumbnail.png: 네이버 대표 이미지 화면
- site-live.png: 사이트 공개 모바일 화면
- live-check.json: 공개 HTML·이미지 해시 검증
- thumbnail-cleanup-manifest.json: 로컬 이미지 복원 정보
