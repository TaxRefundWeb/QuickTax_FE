import { useEffect, useState } from "react";

export type FileTabItem = {
  key: string;      // 고유값 (ex: "2020")
  label: string;    // 표시 텍스트 (ex: "20년")
};

type FileTabProps = {
  items: FileTabItem[];
  activeKey?: string;
  onChange: (key: string) => void;
  onClose?: (key: string) => void;
};

export default function FileTab({
  items,
  activeKey,
  onChange,
  onClose,
}: FileTabProps) {
  const [current, setCurrent] = useState<string | undefined>(activeKey);

  // 외부 activeKey 변경 시 동기화
  useEffect(() => {
    setCurrent(activeKey);
  }, [activeKey]);

  if (items.length === 0) return null;

  return (
    <div className="flex items-end">
      {items.map((item, idx) => {
        const isActive = item.key === current;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setCurrent(item.key);
              onChange(item.key);
            }}
            className={[
              "relative -mb-[1px] flex items-center gap-2",
              "h-[47px] pl-6",
              "border text-[12px] font-medium",
              "rounded-tl-[8px] rounded-tr-[8px] rounded-bl-none rounded-br-none",
              isActive
                ? "w-[160px] bg-[#64A5FF] text-white border-[#64A5FF]"
                : "w-[111px] bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
            ].join(" ")}
          >
            <span>{item.label}</span>

            {onClose && (
              <span
                role="button"
                tabIndex={0}
                aria-label="탭 닫기"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(item.key);
                  if (item.key === current) {
                    const next =
                      items[idx + 1] ??
                      items[idx - 1];

                    if (next) {
                      setCurrent(next.key);
                      onChange(next.key);
                    }
                  }
                }}
                className={[
                    "absolute right-3 top-1/2 -translate-y-1/2",
                    "flex h-5 w-5 items-center justify-center rounded",
                  isActive
                    ? "hover:bg-white/20"
                    : "hover:bg-gray-100",
                ].join(" ")}
              >
                ✕
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
