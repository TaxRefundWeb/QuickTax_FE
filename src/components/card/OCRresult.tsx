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
}: {
  sections: OcrSection[];
  data?: OcrYearData | null;
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
                  <OcrFixedRow
                    key={`${sec.title}-${row.label}`}
                    row={row}
                    data={data}
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

function OcrFixedRow({
  row,
  data,
}: {
  row: OcrRow;
  data?: OcrYearData | null;
}) {
  const raw =
    row.field && data
      ? getValueByPath(data as unknown as Record<string, any>, row.field)
      : null;

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
          <span className="text-[13px] text-gray-700 tabular-nums">
            {formatValue(raw)}
          </span>
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