# 연금계좌 손실과 세액공제 제작 기록

확인일: 2026-10-24 KST. 2026년 귀속, 근로소득만 있는 거주자의 일반 연금저축계좌·IRP 본인 추가납입을 중심으로 작성했다. 현대 연금계좌를 기준으로 하고 구 개인연금저축·ISA 전환 특례 등은 별도 확인 대상으로 구분했다.

## 공식 근거와 판단

1. 소득세법 제59조의3: https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1032951711 (시행 2026-07-01). 적격 납입액 기준, 연금저축 600만 원·퇴직연금 합산 900만 원, 근로소득만 있으면 총급여 5,500만 원 기준 국세 15%·12%. 법령 서비스의 2026-01-01 조문도 동일 내용을 확인했다. 평가잔액 감소만으로 납입액 공제가 감소하지 않는다는 결론은 이 기준을 무인출 사례에 적용한 설명이다.
2. 국세청 연금계좌 공제: https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7875&mi=2238 . 회사 DC 부담금·이연퇴직소득·계약이전 구분. 근로소득 외 다른 종합소득이 있으면 종합소득금액 4,500만 원 기준 등 별도 확인.
3. 소득세법 제61조: https://www.law.go.kr/법령/소득세법/제61조 . 실제 읽은 조문 https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0061&lsiSeq=280405&urlMode=lsScJoRltInfoR . 산출세액 초과 제한 및 제3항의 미공제 취급. 계산액을 무조건 현금 환급으로 설명하지 않는다.
4. 소득세법 시행령 제40조의3: https://www.law.go.kr/법령/소득세법시행령/제40조의3 . 실제 조문 https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=03&joNo=0040&lsiSeq=290841&urlMode=lsScJoRltInfoR (시행 2026-10-01). 과세제외금액→이연퇴직소득→공제 납입액·수익 등의 인출순서, 당해 납입금 우선, 원금 미달 시 인출순서 반대로 손실 차감. 복합 재원 손실 계좌의 해지세금을 누적 원금 전체×16.5%로 일반화하지 않는다.
5. 국세청 기타소득 세율: https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7893&mi=2227 . 일반 연금외수령의 공제 납입금·운용수익 해당 부분 국세 15%.
6. 국세청 연금 재원별 과세: https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7888&mi=6452 . 과세제외·이연퇴직소득·공제 납입금·운용수익의 과세 구분. 지방소득세 포함 일반 16.5% 안내와 비공제 증빙은 금융회사 공식 설명서도 교차 확인했다: https://securities.miraeasset.com/hki/hki3031/n81.do . 의료·부득이한 사유 예외를 별도로 설명했다.
7. 금융감독원 금융꿀팁125 공식 자료의 KDI 재게시: https://eiec.kdi.re.kr/policy/materialView.do?num=222927 . IRP 일부 인출 제한, 일부 인출 가능 사유와 세법상 저율과세 사유의 차이. 2021년 자료이므로 현재 한도 근거로 사용하지 않았다.

## 계산과 범위

- 무인출·무해지, 적격 본인 납입, 공제할 소득세·지방소득세 충분 가정.
- 600만 원×16.5%=99만 원, 600만 원×13.2%=79만 2,000원.
- 900만 원×16.5%=148만 5,000원, 900만 원×13.2%=118만 8,000원.
- 네이버 별도 예시 300만 원 납입·평가액 250만 원: 300만 원×16.5%=49만 5,000원.
- 이미 확인된 과세 대상 인출액 200만 원의 일반 세율 단순 예시: 33만 원. 누적 납입원금 전체에 적용하라는 예시가 아니다.
- 투자손실은 보전되지 않는다. 공제 계산액과 확정 수익·최종 환급액을 구분한다.
- 계좌 안 매도·재매수와 외부 인출을 구분한다. 같은 해 인출 시 단순 유지 예시를 쓰지 말고 금융회사 증빙을 확인하도록 안내했다.
- 계산기 js/calculators/income/pension-saving.js 검토: 일반 납입한도·급여별 비율은 지원하지만 실제 세액 부족·해지세금·ISA 추가 한도 등은 미반영. CTA에 명시했다. 계산기 기능 변경은 없다.

## 플랫폼·발행 기준

- 세 플랫폼 제목·도입·예시·구성·CTA·썸네일 콘셉트 구분.
- 티스토리: 서론→이미지→H2/본문, H2 직후 수동 광고 2개, 법령·공식 근거 링크 제외, 자체 관련 글 카드 2개.
- 네이버: 구두점 뒤 문장 개행, 25개 태그, 자체 관련 글 카드 2개.
- 사용자 추가 지시: 티스토리 글 주소 부분은 영문 소문자·숫자만 사용. 예정 주소 식별자 `pensionlosstaxcredit2026`. 공개 URL에서 직접 확인한다.
- 완료된 썸네일은 Git·인터넷 자산을 보존하고 로컬 thumbnails 작업 폴더에서만 정리한다.

## 이미지 생성

기본 내장 image_gen으로 별개 이미지 3개를 만들었다. 원본 경로는 아래와 같고 WebP 출력은 비율을 보존해 지정 크기로 인코딩했다. 설명용 카드·표·작은 글씨는 넣지 않았다.

- 사이트 원본: C:/Users/Kwonriver/.codex/generated_images/01a15455-71fc-73c2-9db7-695a6401de5d/exec-d5006ea6-0e5e-4b88-a03b-a6ee016a1143.png
- 티스토리 원본: C:/Users/Kwonriver/.codex/generated_images/01a15455-71fc-73c2-9db7-695a6401de5d/exec-f93597fb-e457-4a29-8a0e-cc8bcf4fbe4a.png
- 네이버 원본: C:/Users/Kwonriver/.codex/generated_images/01a15455-71fc-73c2-9db7-695a6401de5d/exec-91f411ef-4049-4bb9-aa97-a2da8bfc1ba1.png

최종 WebP: thumbnails/pension-loss-tax-credit.webp (1200×630), thumbnails/pension-loss-tax-credit-tistory.webp (1080×1080), thumbnails/pension-loss-tax-credit-naver.webp (1200×720).

프롬프트 전체는 prompts.json에 보관한다.
