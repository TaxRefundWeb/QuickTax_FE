export type Customer = {
  id: string;            // row key
  name: string;          // "000님"처럼 표시할 거면 UI에서 붙여도 됨
  birthDate: string;     // YYYY.MM.DD (모달 UI와 동일 포맷)
  rrn: string;           // YYMMDD-XXXXXXX (표시용)
};

export const customersDummy: Customer[] = [
  { id: "CUST-0001", name: "김민수", birthDate: "1989.01.13", rrn: "890113-3340432" },
  { id: "CUST-0002", name: "이서연", birthDate: "1992.06.08", rrn: "920608-2457810" },
  { id: "CUST-0003", name: "박지훈", birthDate: "1985.11.24", rrn: "851124-1234567" },
  { id: "CUST-0004", name: "최유진", birthDate: "1996.03.02", rrn: "960302-4239011" },
  { id: "CUST-0005", name: "정하늘", birthDate: "1990.12.19", rrn: "901219-2123456" },
  { id: "CUST-0006", name: "한지민", birthDate: "1988.07.30", rrn: "880730-3129876" },
  { id: "CUST-0007", name: "오현우", birthDate: "1994.09.15", rrn: "940915-1678901" },
  { id: "CUST-0008", name: "신예린", birthDate: "1999.04.27", rrn: "990427-4560123" },
  { id: "CUST-0009", name: "장도윤", birthDate: "1983.02.10", rrn: "830210-1122334" },
  { id: "CUST-0010", name: "윤수아", birthDate: "1997.10.05", rrn: "971005-2987654" },
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
