export type TaxMethod =
  | "근로소득"
  | "사업소득"
  | "기타소득"
  | "연말정산"
  | "종합소득세"
  | "기타";

export type TaxRecord = {
  year: number;            // 년도
  taxMethod: TaxMethod;    // 세금 계산 방식
  refundAmount: number;    // 환급금 (원 단위)
  filedAt: string;         // 경정청구 진행 일자 (YYYY-MM-DD)
};

export type Customer = {
  id: string;            // row key
  name: string;          // "000님"처럼 표시할 거면 UI에서 붙여도 됨
  birthDate: string;     // YYYY.MM.DD (모달 UI와 동일 포맷)
  rrn: string;           // YYMMDD-XXXXXXX (표시용)
  records: TaxRecord[];
};

export const customersDummy: Customer[] = [
  {
    id: "CUST-0001",
    name: "김민수",
    birthDate: "1989.01.13",
    rrn: "890113-3340432",
    records: [
      { year: 2022, taxMethod: "근로소득", refundAmount: 1280000, filedAt: "2024-01-20" },
      { year: 2021, taxMethod: "근로소득", refundAmount: 540000, filedAt: "2023-12-14" },
      { year: 2020, taxMethod: "근로소득", refundAmount: 310000, filedAt: "2023-05-03" },
    ],
  },
  {
    id: "CUST-0002",
    name: "이서연",
    birthDate: "1992.06.08",
    rrn: "920608-2457810",
    records: [
      { year: 2022, taxMethod: "사업소득", refundAmount: 920000, filedAt: "2024-02-02" },
      { year: 2021, taxMethod: "사업소득", refundAmount: 670000, filedAt: "2023-11-10" },
    ],
  },
  {
    id: "CUST-0003",
    name: "박지훈",
    birthDate: "1985.11.24",
    rrn: "851124-1234567",
    records: [
      { year: 2022, taxMethod: "기타소득", refundAmount: 450000, filedAt: "2024-01-18" },
      { year: 2020, taxMethod: "기타소득", refundAmount: 230000, filedAt: "2023-03-22" },
    ],
  },
  {
    id: "CUST-0004",
    name: "최유진",
    birthDate: "1996.03.02",
    rrn: "960302-4239011",
    records: [
      { year: 2022, taxMethod: "연말정산", refundAmount: 1580000, filedAt: "2024-02-15" },
      { year: 2021, taxMethod: "연말정산", refundAmount: 990000, filedAt: "2023-12-22" },
    ],
  },
  {
    id: "CUST-0005",
    name: "정하늘",
    birthDate: "1990.12.19",
    rrn: "901219-2123456",
    records: [
      { year: 2022, taxMethod: "종합소득세", refundAmount: 760000, filedAt: "2024-01-30" },
      { year: 2021, taxMethod: "종합소득세", refundAmount: 420000, filedAt: "2023-10-05" },
      { year: 2020, taxMethod: "종합소득세", refundAmount: 180000, filedAt: "2023-06-09" },
    ],
  },
  {
    id: "CUST-0006",
    name: "한지민",
    birthDate: "1988.07.30",
    rrn: "880730-3129876",
    records: [
      { year: 2022, taxMethod: "근로소득", refundAmount: 340000, filedAt: "2024-02-20" },
    ],
  },
  {
    id: "CUST-0007",
    name: "오현우",
    birthDate: "1994.09.15",
    rrn: "940915-1678901",
    records: [
      { year: 2022, taxMethod: "사업소득", refundAmount: 1100000, filedAt: "2024-01-12" },
      { year: 2021, taxMethod: "사업소득", refundAmount: 870000, filedAt: "2023-09-27" },
    ],
  },
  {
    id: "CUST-0008",
    name: "신예린",
    birthDate: "1999.04.27",
    rrn: "990427-4560123",
    records: [
      { year: 2022, taxMethod: "기타", refundAmount: 250000, filedAt: "2024-02-08" },
    ],
  },
  {
    id: "CUST-0009",
    name: "장도윤",
    birthDate: "1983.02.10",
    rrn: "830210-1122334",
    records: [
      { year: 2022, taxMethod: "근로소득", refundAmount: 640000, filedAt: "2024-01-05" },
      { year: 2020, taxMethod: "근로소득", refundAmount: 190000, filedAt: "2023-04-18" },
    ],
  },
  {
    id: "CUST-0010",
    name: "윤수아",
    birthDate: "1997.10.05",
    rrn: "971005-2987654",
    records: [
      { year: 2022, taxMethod: "연말정산", refundAmount: 1320000, filedAt: "2024-02-25" },
      { year: 2021, taxMethod: "연말정산", refundAmount: 610000, filedAt: "2023-12-02" },
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
