# 맞벌이 부부 연말정산 — 공개 발행 완료

2026-10-26 공식 자료 확인, 플랫폼별 원고·입체 일러스트 썸네일, 세 곳 공개 발행을 마쳤다.

- TaxCalc: https://taxcalc.co.kr/blog/dual-income-year-end-deductions.html
- 티스토리: https://kwonriver-carstroy.tistory.com/entry/dualincomeyearend2026
- 네이버: https://blog.naver.com/kwonriver_car/224453746754

근거 research.md, 생성 프롬프트 prompts.json, 계산·형식·공개 검증 validation.json, 기존 관련 글 확인 verified-links.json. 기존 테스트 43개 통과, 날짜 메타데이터 정리 후 SEO/빌드 안정성 9개 재검증 통과. 마지막 변경은 티스토리 실제 발행 HTML과 상태 기록이며 사이트 로직 변경은 없다.

사이트는 GitHub Pages run 40244268949 성공과 비로그인 HTTP 200, 공개 HTML·이미지 원본 일치를 확인했다. 네이버는 전체공개·돈 버는 생각 카테고리·태그 24개, 원고 일치·계산기 카드 1개·같은 네이버 글 카드 2개·이미지 로드를 확인했다.

티스토리는 사용자 확인 후 기본모드로 전환했다. 전환 중 사라진 본문 이미지를 서론 다음에 네이티브 방식으로 다시 업로드했다. 공개 본문 33개 문단·소제목이 원고와 공백 정규화 후 일치하고, 수동 광고 2개는 각각 H2와 첫 본문 사이에 유지됐다. 관련 글 네이티브 카드 1개에 제목·설명·이미지가 표시된다. 공식 근거 링크는 없다. 발행 slug는 영문 소문자·숫자만 사용했다. 본문 1080×1080 이미지의 CDN 바이트와 원본이 같고, 대표 OG 이미지와 공개 목록의 작은 썸네일도 같은 새 업로드 이미지임을 확인했다.

새 썸네일 3개와 검증용으로 일시 복원했던 과거 103개를 로컬 thumbnails/에서 정리했다. Git·CDN·인터넷 이미지는 유지했다. Git 추적 썸네일 106개는 skip-worktree 상태로 로컬에만 없으며 삭제를 커밋하지 않았다.

화면·원고 일치·공개 접근·복원용 썸네일 경로·해시·커밋 기록은 저장소 밖 C:/Users/Kwonriver/Desktop/AIGen/sub_job/web_tax_calc/output/dual-income-settlement/ 에 보관했다. tistory-final-source.html과 실제 발행용 업로드 패키지도 최종 이미지·카드로 동기화했다.
