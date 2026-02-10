import type {
  CreateRefundClaimV2Payload,
  RefundClaimV2Case,
  RefundClaimV2Company,
  RefundClaimV2Spouse,
  RefundClaimV2Child,
} from "./refundClaims";

/**
 * 너희 Step1 폼에서 "연도별"로 모아둔 데이터 형태를 여기로 맞춰주면 돼.
 * (필드명은 네 Step1 상태에 맞게 수정 가능)
 */
export type RefundClaimYearForm = {
  // 체크 여부
  spouse_yn: boolean;
  child_yn: boolean;
  reduction_yn: boolean;

  // 회사들
  companies: Array<{
    business_number: string;
    case_work_start: string; // YYYY-MM-DD
    case_work_end: string; // YYYY-MM-DD
    small_business_yn: boolean;
  }>;

  // 배우자/자녀(없으면 비워도 됨)
  spouse?: {
    spouse_name: string;
    spouse_rrn: string;
  } | null;

  children?: Array<{
    child_name: string;
    child_rrn: string;
  }>;
};

export function buildRefundClaimPayloadV2(params: {
  years: number[];
  formsByYear: Record<string, RefundClaimYearForm>;
}): CreateRefundClaimV2Payload {
  const { years, formsByYear } = params;

  const cases: RefundClaimV2Case[] = years.map((y) => {
    const key = String(y);
    const form = formsByYear[key];

    if (!form) {
      // 폼이 없으면 최소값으로라도 보내거나(권장X),
      // 여기서 에러를 던져서 개발 중 바로 잡게 하는 게 좋아.
      throw new Error(`formsByYear[${key}]가 없습니다.`);
    }

    const companies: RefundClaimV2Company[] = (form.companies ?? []).map((c) => ({
      business_number: c.business_number,
      case_work_start: c.case_work_start,
      case_work_end: c.case_work_end,
      small_business_yn: Boolean(c.small_business_yn),
    }));

    // 기본 필드
    const base: RefundClaimV2Case = {
      case_year: y,
      spouse_yn: Boolean(form.spouse_yn),
      child_yn: Boolean(form.child_yn),
      reduction_yn: Boolean(form.reduction_yn),
      companies,
      // refundClaims.ts에서 spouse?:, children?: 로 바꿨다는 전제
    };

    // spouse_yn true일 때만 spouse 포함
    if (base.spouse_yn) {
      const s = form.spouse ?? null;
      const spouse: RefundClaimV2Spouse = {
        spouse_name: s?.spouse_name ?? "",
        spouse_rrn: s?.spouse_rrn ?? "",
      };
      base.spouse = spouse;
    }

    // child_yn true일 때만 children 포함
    if (base.child_yn) {
      const kids = (form.children ?? []).map<RefundClaimV2Child>((k) => ({
        child_name: k.child_name,
        child_rrn: k.child_rrn,
      }));
      base.children = kids;
    }

    return base;
  });

  return { cases };
}

/** (선택) 새로고침 대비 저장/불러오기 헬퍼 */
const KEY = "refundClaimPayloadV2";

export function saveRefundClaimPayload(payload: CreateRefundClaimV2Payload) {
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function loadRefundClaimPayload(): CreateRefundClaimV2Payload | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CreateRefundClaimV2Payload;
  } catch {
    return null;
  }
}