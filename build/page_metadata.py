"""Reference documents and supported scope; not legal certification."""
REVIEW_DATE = '2026-10-06'


def law(name, article=None):
    return (name + (f' 제{article}조' if article else ''),
            'https://www.law.go.kr/법령/' + name.replace(' ', '') +
            (f'/제{article}조' if article else ''))


INCOME = law('소득세법')
LOCAL = law('지방세법')
PENSION = ('국민연금공단: 보험료율 및 기준소득월액', 'https://www.nps.or.kr/eng/ntnlpnsplan/cntb/getOHAI0013M0.do')
HEALTH = ('보건복지부: 건강보험료 산정', 'https://www.mohw.go.kr/menu.es?mid=a10705010500')
CARE = ('보건복지부: 장기요양보험료율', 'https://www.mohw.go.kr/menu.es?mid=a10712030100')

REFERENCES = {
    'loan/calculator': [law('대부업 등의 등록 및 금융이용자 보호에 관한 법률', '8')],
    'loan/dsr': [('금융위원회: 스트레스 DSR 적용 규칙', 'https://better.fsc.go.kr/fsc_new/status/adminMap/PrvntcDetail.do?muNo=144&postNo=5349&stNo=11')],
    'loan/ltv': [('금융위원회: 2026년 7월 규제지역 LTV', 'https://www.fsc.go.kr/no010101/87222'), ('금융위원회: 주택가격별 주담대 한도', 'https://www.fsc.go.kr/no010101/85437')],
    'real-estate/acquisition': [law('지방세법', '11'), law('지방세법', '13의2'), law('농어촌특별세법', '4'), law('지방세특례제한법')],
    'real-estate/officetel-acquisition': [law('지방세법', '11')],
    'real-estate/registration': [law('지방세법', '28')],
    'real-estate/stamp': [law('인지세법', '3')],
    'real-estate/commission': [law('공인중개사법 시행규칙', '20')],
    'real-estate/property-tax': [law('지방세법', '111'), law('지방세법 시행령', '109')],
    'real-estate/comprehensive': [law('종합부동산세법', '8'), law('종합부동산세법', '9')],
    'real-estate/rental-income': [INCOME, law('소득세법', '64의2')],
    'real-estate/capital-gains': [law('소득세법', '95'), law('소득세법', '104'), law('소득세법 시행령', '155')],
    'real-estate/total-cost': [LOCAL, INCOME, law('공인중개사법 시행규칙', '20')],
    'inherit/inheritance': [law('상속세 및 증여세법', '26'), law('상속세 및 증여세법', '21')],
    'inherit/gift': [law('상속세 및 증여세법', '53'), law('상속세 및 증여세법', '53의2')],
    'vehicle/excise': [law('개별소비세법', '1'), law('개별소비세법 시행령', '2의2'), law('조세특례제한법', '109')],
    'vehicle/acquisition': [law('지방세법', '12'), law('지방세특례제한법', '66')],
    'vehicle/buying': [LOCAL, law('개별소비세법'), law('지방세특례제한법')],
    'vehicle/installment': [law('할부거래에 관한 법률')],
    'vehicle/vehicle-tax': [law('지방세법', '127'), law('지방세법 시행령', '125')],
    'vehicle/overdue': [law('지방세기본법', '55'), ('지방세징수법 시행규칙: 2026년 개정 고지서 서식', 'https://www.law.go.kr/flDownload.do?bylClsCd=110202&flSeq=161440135&gubun=')],
    'income/salary': [INCOME, PENSION, HEALTH, CARE],
    'income/employment': [law('소득세법', '47'), law('소득세법', '59의2')],
    'income/insurance': [PENSION, HEALTH, CARE, law('고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률')],
    'income/rent-credit': [law('조세특례제한법', '95의2')],
    'income/hourly-wage': [law('근로기준법', '55'), ('최저임금위원회: 연도별 최저임금', 'https://www.minimumwage.go.kr/minWage/policy/decisionMain.do')],
    'income/daily-worker': [law('소득세법', '47'), law('소득세법', '59'), law('소득세법', '86')],
    'income/freelancer': [law('소득세법', '129'), INCOME],
    'income/business': [law('소득세법', '55'), INCOME],
    'income/vat': [law('부가가치세법', '30'), ('국세청: 간이과세 기준과 신고 기간', 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2272'), ('국세청: 업종별 부가가치율', 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7696&mi=2275')],
    'income/corporate': [law('법인세법', '55'), law('지방세법', '103의20')],
    'income/interest-dividend': [law('소득세법', '14'), law('소득세법', '129')],
    'income/other-income': [law('소득세법', '21'), law('소득세법 시행령', '87')],
    'income/pension-income': [law('소득세법', '14'), law('소득세법', '129')],
    'income/pension-saving': [law('소득세법', '59의3')],
    'income/severance': [law('근로자퇴직급여 보장법', '8'), law('근로기준법', '2')],
    'income/retirement': [law('소득세법', '48'), law('소득세법', '55')],
    'income/comprehensive': [law('소득세법', '55'), INCOME],
    'income/penalty': [law('국세기본법', '47의2'), law('국세기본법', '47의4')],
    'income/customs': [law('관세법', '94'), law('관세법 시행규칙', '45')],
    'stocks/domestic': [law('소득세법', '104'), law('소득세법 시행령', '157')],
    'stocks/foreign': [law('소득세법', '104'), law('소득세법', '103')],
    'stocks/transaction': [law('증권거래세법 시행령', '5'), law('농어촌특별세법', '5')],
    'stocks/dividend': [law('소득세법', '14'), law('소득세법', '129')],
    'fines/traffic': [law('도로교통법 시행령')],
    'fines/parking': [law('도로교통법 시행령'), law('질서위반행위규제법', '18')],
    'fines/living': [law('질서위반행위규제법'), law('폐기물관리법', '68')],
    'other/resident': [law('지방세법', '78'), law('지방세법', '81')],
    'other/fuel': [law('교통ㆍ에너지ㆍ환경세법 시행령', '3'), law('개별소비세법 시행령'), law('부가가치세법', '30')],
    'other/customs-info': [law('관세법', '94'), law('관세법 시행규칙', '45')],
    'other/excise-info': [law('개별소비세법', '1')],
    'other/liquor': [law('주세법', '8')],
    'other/tobacco': [law('지방세법', '52')],
    'other/leisure': [law('지방세법', '42')],
    'other/progressive-tax': [law('소득세법', '55')],
    'other/no-son-day': [('한국천문연구원: 음양력 변환', 'https://astro.kasi.re.kr/life/pageView/8')],
}

LIMITS = {
    'loan': '금리·기간을 고정한 상환 또는 한도 추정입니다. 실제 대출 승인, 스트레스 금리, 지역·상품별 제한과 은행 심사는 별도로 확인해야 합니다.',
    'real-estate': '일반 개인 거래의 추정치입니다. 주택 수 제외 특례, 공동명의, 지역 조례, 세부 감면 요건·추징, 세부담 상한과 기납부세액은 별도 확인이 필요합니다.',
    'inherit': '입력한 재산과 공제를 기준으로 추정합니다. 재산 평가, 사전증여 합산, 채무 입증, 배우자 실제 상속액 및 공제 적격 여부는 별도 확인이 필요합니다.',
    'vehicle': '선택한 차종과 조건으로 추정합니다. 과세표준, 공채 할인율, 한시 감면과 제조사 할인·보조금은 실제 계약·등록 시점에 확인해야 합니다.',
    'income': '입력한 소득·공제만 반영한 추정치입니다. 실제 원천징수표, 소득 합산, 공제 적격 여부, 세액감면·기납부세액은 신고 자료와 대조해야 합니다.',
    'stocks': '개인 투자자의 입력값 기준 추정입니다. 대주주·특수관계인 판정, 국가별 원천세, 환율 적용일, 연간 손익통산과 증권사 수수료는 별도 확인이 필요합니다.',
    'fines': '일반적인 안내 금액이며 처분을 확정하지 않습니다. 차량 종류, 보호구역, 지방 조례, 위반 사유와 통지서에 따라 실제 부과액이 다릅니다.',
    'other': '일반 구조를 설명하는 참고 자료입니다. 지역 조례, 품목 분류와 탄력세율·한시 규정은 관할 기관에서 확인해야 합니다.',
}

PAGE_LIMITS = {
    'loan/ltv': '일반 개인의 주택 구입을 대상으로 규제지역 40%·비규제지역 70%와 수도권 여부·시가별 금액 상한을 비교합니다. 생애최초·정책모기지·생활안정·중도금·이주비·사업자대출·경과규정·지역 지정 여부는 자동 판정하지 않습니다. 토지거래허가만으로 LTV 40%가 적용되는 것은 아닙니다.',
    'loan/dsr': '연간 상환 부담을 단순 추정하며 금융기관의 규제 심사를 재현하지 않습니다. 만기일시는 입력 만기로 원금을 연환산하고, 최대 금액은 원리금균등 기준으로 역산합니다. 상품별 규제 산정만기·면제·소득 인정은 자동 반영하지 않으며 스트레스 추가 금리는 실제 적용값을 입력해야 합니다.',
    'vehicle/overdue': '2024년 이후 납기 고지분의 3%와 세액 45만원 이상 월별 추가분 0.66%를 추정합니다. 고지서별 세액 단위, 부분 납부·정산, 이전 연도의 규칙과 신고납부 세금의 일 단위 가산세는 실제 고지서에서 확인해야 합니다.',
    'income/vat': '일반과세는 부가세 제외 공급가액, 간이과세는 부가세 포함 연간 공급대가를 입력합니다. 적격 매입만 입력하며 신용카드 발행공제·의제매입·공통매입 안분·영세율·기납부액·신규 및 휴폐업 연환산은 자동 반영하지 않습니다.',
    'income/corporate': '2026년 1월 1일 이후 개시하는 사업연도의 일반 법인 산출세액을 추정합니다. 소규모 법인 특례, 최저한세, 이월결손금, 세액공제·감면과 중간예납을 자동 적용하지 않습니다. 지방세는 같은 과세표준의 일반 세율을 단순 적용한 값입니다.',
    'income/insurance': '직장가입자 요율을 기준으로 합니다. 사업주 고용안정·직업능력개발 추가 보험료는 별도이며 산재율은 예시입니다. 지역가입자 건강보험은 재산·세대별 자료 없이 확정할 수 없어 이 계산기에서 제공하지 않습니다. 보험료 고지서의 원 단위 처리·정산액과 차이가 날 수 있습니다.',
    'income/salary': '소득세는 연간 세율을 이용한 근사치이며 국세청 근로소득 간이세액표를 직접 조회한 값이 아닙니다. 고소득자의 건강보험 상한·연말 정산, 보수월액 결정 및 공제 요건에 따라 급여명세서와 다를 수 있습니다.',
    'real-estate/acquisition': '주택·비주택·토지의 유상매매 전용입니다. 상속·증여 세율, 법인 취득, 주택 수 제외 특례와 일시적 2주택을 자동 판정하지 않습니다. 감면 선택은 자격 확인을 대신하지 않으며 지방교육세 연동 감면·감면분 농특세는 관할 기관에서 확인해야 합니다. 국민주택 규모는 일반적으로 85㎡이며 일부 읍·면의 100㎡ 특례는 자동 적용하지 않습니다.',
    'vehicle/excise': '구매가격으로 세전 가격을 역산하는 기본세율 5% 모형입니다. 제조사별 기준판매비율·과세표준 차이와 한시 탄력세율을 자동 판정하지 않습니다. 실제 출고 세금은 제조사 명세서에서 확인하세요.',
    'other/no-son-day': '음력 날짜를 이용한 전통 민속 달력입니다. 법정 기일·세금 규정이나 이사 결과를 보장하는 기준이 아닙니다.',
}
