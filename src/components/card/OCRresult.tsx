import type { OcrYearData } from "../../lib/api/ocr";

type OcrRow = {
  label: string;
  badge?: string;

  // Swagger 필드 경로
  field?: string; // "totalSalary" or "companies[0].salary"
};

type OcrSection = {
  title: string;
  rows: OcrRow[];
};

export default function OCRresult({
  sections,
  data,
  editable = false,
  onChange,
}: {
  sections: OcrSection[];
  data?: OcrYearData | null;

  // 추가
  editable?: boolean;
  onChange?: (path: string, value: string) => void;
}) {
  return (
    <div className="flex-1 w-[600px] mx-auto max-h-[600px] rounded-[8px] overflow-hidden">
      <div className="h-full overflow-auto">
        <div className="bg-[#F3F8FF] px-6 py-5 min-h-full">
          {sections.map((sec, idx) => (
            <div key={sec.title}>
              <h2 className="mb-4 text-[16px] text-gray-800">{sec.title}</h2>

              <div className="pl-5 space-y-3">
                {sec.rows.map((row) => (
                  <OcrRowItem
                    key={`${sec.title}-${row.label}`}
                    row={row}
                    data={data}
                    editable={editable}
                    onChange={onChange}
                  />
                ))}
              </div>

              {idx !== sections.length - 1 ? (
                <div className="my-5 h-px bg-[#D8E6FF]" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OcrRowItem({
  row,
  data,
  editable,
  onChange,
}: {
  row: OcrRow;
  data?: OcrYearData | null;
  editable: boolean;
  onChange?: (path: string, value: string) => void;
}) {
  const raw =
    row.field && data
      ? getValueByPath(data as unknown as Record<string, any>, row.field)
      : null;

  // input value는 "표시값(콤마)" 말고 "원 값(콤마 없는)"으로 유지
  const inputValue = raw === null || raw === undefined ? "" : String(raw);

  return (
    <div className="grid grid-cols-[1fr_220px] items-center gap-3">
      <span className="font-inter text-[16px] text-[#6D6D6D] leading-normal">
        {row.label}
      </span>

      <div className="flex items-center justify-end gap-1">
        {row.badge ? (
          <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-[#E7F0FF] px-2 text-[10px] font-medium text-[#2F6FED]">
            {row.badge}
          </span>
        ) : null}

        <div className="h-[36px] w-[180px] rounded-[6px] border border-gray-200 bg-white px-3 flex items-center justify-end">
          {/* editable이면 input */}
          {editable && row.field ? (
            <input
              className="w-full text-right text-[13px] text-gray-700 tabular-nums outline-none"
              value={inputValue}
              placeholder="-"
              inputMode="numeric"
              onChange={(e) => onChange?.(row.field!, e.target.value)}
            />
          ) : (
            <span className="text-[13px] text-gray-700 tabular-nums">
              {formatValue(raw)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function formatValue(v: unknown) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "number") return new Intl.NumberFormat("ko-KR").format(v);
  if (typeof v === "string" && v.trim() !== "") return v;
  return "-";
}

// companies[0].salary 지원
function getValueByPath(obj: Record<string, any>, path: string): unknown {
  try {
    const tokens: Array<string | number> = [];
    const re = /([^[.\]]+)|\[(\d+)\]/g;

    let m: RegExpExecArray | null;
    while ((m = re.exec(path))) {
      if (m[1] !== undefined) tokens.push(m[1]);
      if (m[2] !== undefined) tokens.push(Number(m[2]));
    }

    let cur: any = obj;
    for (const t of tokens) {
      if (cur === null || cur === undefined) return null;
      cur = cur[t as any];
    }
    return cur ?? null;
  } catch {
    return null;
  }
}

export type { OcrRow, OcrSection };