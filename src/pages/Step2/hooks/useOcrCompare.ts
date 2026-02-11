import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCaseOcr,
  patchCaseOcr,
  type OcrStatus,
  type OcrYearData,
} from "../../../lib/api/ocr";

export function useOcrCompare(params: {
  caseId: number | null;
  openYears: number[];
  activeYear: string;
}) {
  const { caseId, openYears, activeYear } = params;

  // OCR 로딩/상태/데이터
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrByYear, setOcrByYear] = useState<Record<string, OcrYearData>>({});

  // draft/snapshot/patch
  const [draftByYear, setDraftByYear] = useState<Record<string, OcrYearData>>(
    {}
  );
  const snapshotRef = useRef<Record<string, OcrYearData>>({});
  const [isPatchLoading, setIsPatchLoading] = useState(false);

  const fetchOcr = async () => {
    if (!Number.isFinite(caseId)) return;

    try {
      setIsOcrLoading(true);
      setOcrError(null);

      const res = await getCaseOcr(caseId!);

      setOcrStatus(res.result.status);

      if (res.result.status === "FAILED") {
        setOcrError(res.result.errorMessage ?? "OCR 처리 중 오류가 발생했어요.");
        setOcrByYear({});
        return;
      }

      const list = res.result.data ?? [];
      const map: Record<string, OcrYearData> = {};
      for (const item of list) map[String(item.caseYear)] = item;

      setOcrByYear(map);

      // draft 초기화: 기존 사용자 수정 덮어쓰기 방지
      setDraftByYear((prev) => {
        const next = { ...prev };
        for (const [y, d] of Object.entries(map)) {
          if (!next[y]) next[y] = safeClone(d);
        }
        return next;
      });

      // snapshot 초기화(처음만) + 새 year만 추가
      if (Object.keys(snapshotRef.current).length === 0) {
        const snap: Record<string, OcrYearData> = {};
        for (const [y, d] of Object.entries(map)) snap[y] = safeClone(d);
        snapshotRef.current = snap;
      } else {
        const snap = { ...snapshotRef.current };
        let changed = false;
        for (const [y, d] of Object.entries(map)) {
          if (!snap[y]) {
            snap[y] = safeClone(d);
            changed = true;
          }
        }
        if (changed) snapshotRef.current = snap;
      }
    } catch (e) {
      console.error(e);
      setOcrError("OCR 결과를 불러오지 못했어요.");
      setOcrByYear({});
    } finally {
      setIsOcrLoading(false);
    }
  };

  // 최초 1회 GET
  useEffect(() => {
    void fetchOcr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // 폴링: WAITING_UPLOAD / PROCESSING이면 3초마다 다시 GET
  useEffect(() => {
    if (!Number.isFinite(caseId)) return;
    if (ocrStatus !== "WAITING_UPLOAD" && ocrStatus !== "PROCESSING") return;

    const id = window.setInterval(() => {
      void fetchOcr();
    }, 3000);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, ocrStatus]);

  const currentOcr = useMemo(() => {
    if (!activeYear) return null;
    return ocrByYear[activeYear] ?? null;
  }, [activeYear, ocrByYear]);

  const currentDraft = useMemo(() => {
    if (!activeYear) return null;
    return draftByYear[activeYear] ?? currentOcr ?? null;
  }, [activeYear, draftByYear, currentOcr]);

  const isAnyDirty = useMemo(() => {
    const snap = snapshotRef.current;
    const years = Object.keys({ ...snap, ...draftByYear });
    for (const y of years) {
      const a = snap[y];
      const b = draftByYear[y];
      if (!a || !b) continue;
      if (JSON.stringify(a) !== JSON.stringify(b)) return true;
    }
    return false;
  }, [draftByYear]);

  const submitButtonLabel = isAnyDirty ? "수정완료" : "입력완료";

  const handleChangeOcrField = (path: string, value: string) => {
    if (!activeYear) return;

    setDraftByYear((prev) => {
      const base = prev[activeYear]
        ? safeClone(prev[activeYear])
        : currentOcr
        ? safeClone(currentOcr)
        : null;

      if (!base) return prev;

      setValueByPath(
        base as unknown as Record<string, unknown>,
        path,
        normalizeInputValue(value)
      );
      return { ...prev, [activeYear]: base };
    });
  };

  // PATCH(전체년도) + snapshot 갱신
  const submitPatchAllYears = async () => {
    if (!Number.isFinite(caseId)) return { ok: false as const, reason: "no_caseId" };
    if (!isAnyDirty) return { ok: false as const, reason: "not_dirty" };

    try {
      setIsPatchLoading(true);
      const body = buildPatchBodyFromDraftAllYears(draftByYear, openYears);
      const res = await patchCaseOcr(caseId!, body);

      if (!res.isSuccess) {
        return { ok: false as const, reason: "failed", message: res.message };
      }

      // snapshot 갱신
      const next = { ...snapshotRef.current };
      for (const y of Object.keys(draftByYear)) next[y] = safeClone(draftByYear[y]);
      snapshotRef.current = next;

      return { ok: true as const };
    } catch (e) {
      console.error(e);
      return { ok: false as const, reason: "error" };
    } finally {
      setIsPatchLoading(false);
    }
  };

  return {
    // 상태
    isOcrLoading,
    ocrStatus,
    ocrError,

    // 데이터
    currentDraft,

    // 입력/저장
    handleChangeOcrField,
    isAnyDirty,
    submitButtonLabel,
    isPatchLoading,
    submitPatchAllYears,

    // 필요하면 외부에서 강제 리프레시
    refetch: fetchOcr,
  };
}

/* =========================
   아래는 기존 유틸들 (hook로 이동)
========================= */

function safeClone<T>(v: T): T {
  try {
    return structuredClone(v);
  } catch {
    return JSON.parse(JSON.stringify(v)) as T;
  }
}

function normalizeInputValue(v: string): number | string | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : s;
}

function setValueByPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const tokens: Array<string | number> = [];
  const re = /([^[.\]]+)|\[(\d+)\]/g;

  let m: RegExpExecArray | null;
  while ((m = re.exec(path))) {
    if (m[1] !== undefined) tokens.push(m[1]);
    if (m[2] !== undefined) tokens.push(Number(m[2]));
  }
  if (tokens.length === 0) return;

  let cur: unknown = obj;

  for (let i = 0; i < tokens.length - 1; i++) {
    const t = tokens[i];
    const next = tokens[i + 1];

    if (typeof cur !== "object" || cur === null) return;
    const rec = cur as Record<string, unknown>;

    const key = String(t);
    const existing = rec[key];

    if (existing === null || existing === undefined) {
      rec[key] = typeof next === "number" ? ([] as unknown[]) : ({} as Record<string, unknown>);
    }

    cur = rec[key];
  }

  if (typeof cur !== "object" || cur === null) return;
  const rec = cur as Record<string, unknown>;
  const last = tokens[tokens.length - 1];
  rec[String(last)] = value;
}

function toNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function get(obj: unknown, key: string): unknown {
  if (typeof obj !== "object" || obj === null) return undefined;
  return (obj as Record<string, unknown>)[key];
}

function buildPatchBodyFromDraftAllYears(
  draftByYear: Record<string, OcrYearData>,
  openYears: number[]
) {
  const OCRData = openYears
    .map((y) => String(y))
    .map((yKey) => draftByYear[yKey])
    .filter((d): d is OcrYearData => Boolean(d))
    .map((d) => {
      const u: unknown = d;

      return {
        case_year: toNum(get(u, "caseYear")),
        total_salary: toNum(get(u, "totalSalary")),
        earned_income_deduction_amount: toNum(get(u, "earnedIncomeDeductionAmount")),
        earned_income_amount: toNum(get(u, "earnedIncomeAmount")),
        basic_deduction_self_amount: toNum(get(u, "basicDeductionSelfAmount")),
        basic_deduction_spouse_amount: toNum(get(u, "basicDeductionSpouseAmount")),
        basic_deduction_dependents_amount: toNum(get(u, "basicDeductionDependentsAmount")),
        national_pension_deduction_amount: toNum(get(u, "nationalPensionDeductionAmount")),
        total_special_income_deduction_amount: toNum(get(u, "totalSpecialIncomeDeductionTotalAmount")),
        adjusted_income_amount: toNum(get(u, "adjustedIncomeAmount")),
        other_income_deduction_total_amount: toNum(get(u, "otherIncomeDeductionTotalAmount")),
        other_income_deduction_extra: toNum(get(u, "otherIncomeDeductionExtra")),
        tax_base_amount: toNum(get(u, "taxBaseAmount")),
        calculated_tax_amount: toNum(get(u, "calculatedTaxAmount")),
        tax_reduction_total_amount: toNum(get(u, "taxReductionTotalAmount")),
        earned_income_total_amount: toNum(get(u, "earnedIncomeTotalAmount")),
        eligible_children_count: toNum(get(u, "eligibleChildrenCount")),
        childbirth_adoption_count: toNum(get(u, "childbirthAdoptionCount")),
        donation_total_amount: toNum(get(u, "donationTotalAmount")),
        standard_tax_credit: toNum(get(u, "standardTaxCredit")),
        monthly_rent_tax_credit_amount: toNum(get(u, "monthlyRentTaxCreditAmount")),
        total_tax_credit_amount: toNum(get(u, "totalTaxCreditAmount")),
        determined_tax_amount: toNum(get(u, "determinedTaxAmountOrigin") ?? get(u, "determinedTaxAmount")),
      };
    });

  return { OCRData };
}