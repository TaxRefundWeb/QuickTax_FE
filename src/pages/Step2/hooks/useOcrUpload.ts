import { useEffect, useRef, useState } from "react";
import { postOcrComplete, postOcrPresign, type OcrStatus } from "../../../lib/api/ocr";

type UploadPhase = "idle" | "presigning" | "uploading" | "completing" | "done" | "error";

function sleep(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms));
}

export function useOcrUpload(caseId: number | null) {
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [completeStatus, setCompleteStatus] = useState<OcrStatus | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const isBusy = phase === "presigning" || phase === "uploading" || phase === "completing";

  // ✅ 이름을 resetUpload로 고정해서 반환
  const resetUpload = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setError(null);
    setCompleteStatus(null);
  };

  const startUpload = async (file: File) => {
    if (!Number.isFinite(caseId)) {
      setPhase("error");
      setError("caseId가 없어서 업로드를 시작할 수 없어요.");
      return false;
    }

    const isPdf =
      file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      setPhase("error");
      setError("PDF 파일만 업로드할 수 있어요.");
      return false;
    }

    // 이전 작업 중단
    abortRef.current?.abort();
    abortRef.current = null;

    try {
      setError(null);
      setCompleteStatus(null);

      // 1) presign
      setPhase("presigning");
      const presignRes = await postOcrPresign(caseId!);
      console.log("[presignRes]", presignRes);

      if (!presignRes.isSuccess) throw new Error(presignRes.message || "presign 실패");

      const { uploadUrl } = presignRes.result;

      // 2) S3 PUT (✅ 여기서 진짜 'URL로 파일 보내는' 거임)
      setPhase("uploading");
      const controller = new AbortController();
      abortRef.current = controller;

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "application/pdf" },
        signal: controller.signal,
      });

      console.log("[s3Put]", putRes.status, putRes.ok);

      if (!putRes.ok) {
        const txt = await putRes.text().catch(() => "");
        throw new Error(`S3 업로드 실패: HTTP ${putRes.status}${txt ? ` - ${txt}` : ""}`);
      }

      // 3) complete (WAITING_UPLOAD이면 재시도)
      setPhase("completing");

      const maxTries = 12;
      let last: OcrStatus = "WAITING_UPLOAD";

      for (let i = 1; i <= maxTries; i++) {
        const completeRes = await postOcrComplete(caseId!);
        console.log(`[complete ${i}]`, completeRes);

        if (!completeRes.isSuccess) throw new Error(completeRes.message || "complete 실패");

        last = completeRes.result.status;
        setCompleteStatus(last);

        if (last !== "WAITING_UPLOAD") break;

        await sleep(700 + i * 250);
      }

      if (last === "WAITING_UPLOAD") {
        throw new Error("complete가 계속 WAITING_UPLOAD예요. (S3 업로드 감지 실패)");
      }

      if (last === "FAILED") {
        throw new Error("complete 결과가 FAILED예요. 서버 errorCode/errorMessage 확인 필요.");
      }

      setPhase("done");
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setPhase("idle");
        return false;
      }

      const msg = e instanceof Error ? e.message : "업로드 중 오류";
      console.error(e);
      setPhase("error");
      setError(msg);
      return false;
    } finally {
      abortRef.current = null;
    }
  };

  // ✅ resetUpload를 반드시 반환 (이게 핵심)
  return { phase, error, completeStatus, isBusy, startUpload, resetUpload };
}
