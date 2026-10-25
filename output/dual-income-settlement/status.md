# 맞벌이 부부 연말정산 발행 작업

2026-10-26 사용자 요청: 공식 자료 확인, 승인된 입체 일러스트 스타일, 세 플랫폼 공개 발행.

- 세 플랫폼 원고·별도 썸네일 완성. 근거 research.md, 프롬프트 prompts.json, 공개 관련 링크 verified-links.json.
- 43개 기존 테스트 통과. 생성 과정에서 생긴 무관한 구글 표 스타일 재생성 차이는 제외하고 새 글·목록·관련 계산기 가이드·사이트맵만 반영. 날짜 메타데이터 정리 후 SEO/빌드 안정성 9개 재검증 통과.
- 사이트 공개 배포 완료: https://taxcalc.co.kr/blog/dual-income-year-end-deductions.html . GitHub Pages run 40244268949 성공, 비로그인 HTTP 200 및 공개 HTML 원본 일치, 배포된 썸네일 3개 해시 일치 확인.
- 네이버 전체공개 발행 완료: https://blog.naver.com/kwonriver_car/224453746754 . 돈 버는 생각 카테고리, 태그 24개, 공개 본문 원고 일치, 계산기 카드 1개와 같은 네이버 글 카드 2개, 모든 카드·본문 이미지 로드 확인. 공개 화면 naver-published.png 보관.
- 티스토리 HTML 입력 완료(광고 2개, 네이티브 업로드 이미지 1개, 태그 10개). 소스가 원고와 공백/제로폭 문자 정규화 후 일치함을 확인. 기본모드 전환 확인창 사용자 클릭 대기 중; 관련 글 네이티브 카드와 최종 발행 확인은 남음. getJsDialog로 confirm 존재를 확인했으나 accept는 브라우저 초점 명령 시간 초과로 실행되지 않음.

작업 화면과 입력 검수 자료는 저장소 밖 C:/Users/Kwonriver/Desktop/AIGen/sub_job/web_tax_calc/output/dual-income-settlement/ 에 보관.
