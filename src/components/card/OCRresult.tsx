type OcrRow = {
  label: string;
  badge?: string;
};

type OcrSection = {
  title: string;
  rows: OcrRow[];
};

export default function OCRresult({
  sections,
}: {
  sections: OcrSection[];
}) {
  return (
    // 파란 카드(고정 크기)만 담당
    <div className="flex-1 w-[600px] mx-auto max-h-[600px] rounded-[8px] overflow-hidden">
      <div className="h-full overflow-auto">
        <div className="bg-[#F3F8FF] px-6 py-5 min-h-full">
          {sections.map((sec, idx) => (
            <div key={sec.title}>
              <h2 className="mb-4 text-[16px] text-gray-800">{sec.title}</h2>

              <div className="pl-5 space-y-3">
                {sec.rows.map((row) => (
                  <OcrFixedRow key={`${sec.title}-${row.label}`} row={row} />
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

function OcrFixedRow({ row }: { row: OcrRow }) {
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

        <div className="h-[36px] w-[180px] rounded-[6px] border border-gray-200 bg-white" />
      </div>
    </div>
  );
}

export type { OcrRow, OcrSection };