export type TaxMethod =
  | "근로소득"
  | "사업소득"
  | "기타소득"
  | "연말정산"
  | "종합소득세"
  | "기타";

export type RefundPlan = {
  id: string; // "PLAN-1"
  title: string; // "PLAN 1"
  refundExpected: number; // 환급금 예상액
  effectiveRate: number; // 실효세율 (%)
  extraRefundPercent: number; // 기존 대비 추가 환급 (%)
  calculatedTax: number; // 산출세액
  determinedTax: number; // 결정세액
};

export type TaxRecord = {
  year: number; // 년도
  taxMethod: TaxMethod; // 세금 계산 방식
  refundAmount: number; // 환급금 (원 단위)
  filedAt: string; // 경정청구 진행 일자 (YYYY-MM-DD)

  // step3 카드(서버 계산 결과) 더미: 사람/연도마다 1~3개
  plans: RefundPlan[];
};

export type Customer = {
  id: string; // row key
  name: string; // "000님"처럼 표시할 거면 UI에서 붙여도 됨
  birthDate: string; // YYYY.MM.DD (모달 UI와 동일 포맷)
  rrn: string; // YYMMDD-XXXXXXX (표시용)
  records: TaxRecord[];
};

function hashToInt(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * 고객/연도/기본환급금으로 1~3개 카드(PLAN)를 자동 생성
 * - 같은 customerId+year면 항상 같은 결과가 나오게(더미 안정성)
 */
function makePlans(customerId: string, year: number, baseRefund: number): RefundPlan[] {
  const seed = hashToInt(`${customerId}-${year}`);
  const count = (seed % 3) + 1; // 1~3개

  const baseEffective = 3.6 + (seed % 10) * 0.1; // 3.6~4.5 근처
  const baseExtra = 15 + (seed % 3) * 10; // 15/25/35

  // 더미 숫자 범위만 자연스럽게 맞춤
  const baseCalculated = Math.round(baseRefund * (1.8 + (seed % 7) * 0.05));
  const baseDetermined = Math.round(baseCalculated * (0.62 + (seed % 5) * 0.03));

  return Array.from({ length: count }).map((_, idx) => {
    const planNo = idx + 1;

    const refundExpected = Math.round(baseRefund * (0.92 + idx * 0.06)); // PLAN1~3 점진 증가
    const effectiveRate = Number((baseEffective + idx * 0.3).toFixed(1));
    const extraRefundPercent = baseExtra + idx * 10;

    const calculatedTax = Math.round(baseCalculated * (0.95 + idx * 0.04));
    const determinedTax = Math.round(baseDetermined * (0.95 + idx * 0.03));

    return {
      id: `PLAN-${planNo}`,
      title: `PLAN ${planNo}`,
      refundExpected,
      effectiveRate,
      extraRefundPercent,
      calculatedTax,
      determinedTax,
    };
  });
}

export const customersDummy: Customer[] = [
  {
    id: "CUST-0001",
    name: "김민수",
    birthDate: "1989.01.13",
    rrn: "890113-3340432",
    records: [
      {
        year: 2022,
        taxMethod: "근로소득",
        refundAmount: 1280000,
        filedAt: "2024-01-20",
        plans: makePlans("CUST-0001", 2022, 1280000),
      },
      {
        year: 2021,
        taxMethod: "근로소득",
        refundAmount: 540000,
        filedAt: "2023-12-14",
        plans: makePlans("CUST-0001", 2021, 540000),
      },
      {
        year: 2020,
        taxMethod: "근로소득",
        refundAmount: 310000,
        filedAt: "2023-05-03",
        plans: makePlans("CUST-0001", 2020, 310000),
      },
    ],
  },
  {
    id: "CUST-0002",
    name: "이서연",
    birthDate: "1992.06.08",
    rrn: "920608-2457810",
    records: [
      {
        year: 2022,
        taxMethod: "사업소득",
        refundAmount: 920000,
        filedAt: "2024-02-02",
        plans: makePlans("CUST-0002", 2022, 920000),
      },
      {
        year: 2021,
        taxMethod: "사업소득",
        refundAmount: 670000,
        filedAt: "2023-11-10",
        plans: makePlans("CUST-0002", 2021, 670000),
      },
    ],
  },
  {
    id: "CUST-0003",
    name: "박지훈",
    birthDate: "1985.11.24",
    rrn: "851124-1234567",
    records: [
      {
        year: 2022,
        taxMethod: "기타소득",
        refundAmount: 450000,
        filedAt: "2024-01-18",
        plans: makePlans("CUST-0003", 2022, 450000),
      },
      {
        year: 2020,
        taxMethod: "기타소득",
        refundAmount: 230000,
        filedAt: "2023-03-22",
        plans: makePlans("CUST-0003", 2020, 230000),
      },
    ],
  },
  {
    id: "CUST-0004",
    name: "최유진",
    birthDate: "1996.03.02",
    rrn: "960302-4239011",
    records: [
      {
        year: 2022,
        taxMethod: "연말정산",
        refundAmount: 1580000,
        filedAt: "2024-02-15",
        plans: makePlans("CUST-0004", 2022, 1580000),
      },
      {
        year: 2021,
        taxMethod: "연말정산",
        refundAmount: 990000,
        filedAt: "2023-12-22",
        plans: makePlans("CUST-0004", 2021, 990000),
      },
    ],
  },
  {
    id: "CUST-0005",
    name: "정하늘",
    birthDate: "1990.12.19",
    rrn: "901219-2123456",
    records: [
      {
        year: 2022,
        taxMethod: "종합소득세",
        refundAmount: 760000,
        filedAt: "2024-01-30",
        plans: makePlans("CUST-0005", 2022, 760000),
      },
      {
        year: 2021,
        taxMethod: "종합소득세",
        refundAmount: 420000,
        filedAt: "2023-10-05",
        plans: makePlans("CUST-0005", 2021, 420000),
      },
      {
        year: 2020,
        taxMethod: "종합소득세",
        refundAmount: 180000,
        filedAt: "2023-06-09",
        plans: makePlans("CUST-0005", 2020, 180000),
      },
    ],
  },
  {
    id: "CUST-0006",
    name: "한지민",
    birthDate: "1988.07.30",
    rrn: "880730-3129876",
    records: [
      {
        year: 2022,
        taxMethod: "근로소득",
        refundAmount: 340000,
        filedAt: "2024-02-20",
        plans: makePlans("CUST-0006", 2022, 340000),
      },
    ],
  },
  {
    id: "CUST-0007",
    name: "오현우",
    birthDate: "1994.09.15",
    rrn: "940915-1678901",
    records: [
      {
        year: 2022,
        taxMethod: "사업소득",
        refundAmount: 1100000,
        filedAt: "2024-01-12",
        plans: makePlans("CUST-0007", 2022, 1100000),
      },
      {
        year: 2021,
        taxMethod: "사업소득",
        refundAmount: 870000,
        filedAt: "2023-09-27",
        plans: makePlans("CUST-0007", 2021, 870000),
      },
    ],
  },
  {
    id: "CUST-0008",
    name: "신예린",
    birthDate: "1999.04.27",
    rrn: "990427-4560123",
    records: [
      {
        year: 2022,
        taxMethod: "기타",
        refundAmount: 250000,
        filedAt: "2024-02-08",
        plans: makePlans("CUST-0008", 2022, 250000),
      },
    ],
  },
  {
    id: "CUST-0009",
    name: "장도윤",
    birthDate: "1983.02.10",
    rrn: "830210-1122334",
    records: [
      {
        year: 2022,
        taxMethod: "근로소득",
        refundAmount: 640000,
        filedAt: "2024-01-05",
        plans: makePlans("CUST-0009", 2022, 640000),
      },
      {
        year: 2020,
        taxMethod: "근로소득",
        refundAmount: 190000,
        filedAt: "2023-04-18",
        plans: makePlans("CUST-0009", 2020, 190000),
      },
    ],
  },
  {
    id: "CUST-0010",
    name: "윤수아",
    birthDate: "1997.10.05",
    rrn: "971005-2987654",
    records: [
      {
        year: 2022,
        taxMethod: "연말정산",
        refundAmount: 1320000,
        filedAt: "2024-02-25",
        plans: makePlans("CUST-0010", 2022, 1320000),
      },
      {
        year: 2021,
        taxMethod: "연말정산",
        refundAmount: 610000,
        filedAt: "2023-12-02",
        plans: makePlans("CUST-0010", 2021, 610000),
      },
    ],
  },
];

/**
 * 검색: "고객명 또는 생년월일" (예: 김, 1989, 1989.01, 1989.01.13 등)
 */
export function filterCustomers(customers: Customer[], query: string) {
  const q = query.trim();
  if (!q) return customers;

  const normalized = q.replace(/\s+/g, "").toLowerCase();
  return customers.filter((c) => {
    const name = c.name.replace(/\s+/g, "").toLowerCase();
    const birth = c.birthDate.replace(/\s+/g, "").toLowerCase();
    return name.includes(normalized) || birth.includes(normalized);
  });
}

/** (선택) 특정 고객의 연도 목록(내림차순) */
export function getCustomerYears(customer: Customer) {
  return Array.from(new Set(customer.records.map((r) => r.year))).sort((a, b) => b - a);
}

/** (선택) 특정 고객의 특정 연도 기록 */
export function getCustomerRecordByYear(customer: Customer, year: number) {
  return customer.records.find((r) => r.year === year) ?? null;
}
