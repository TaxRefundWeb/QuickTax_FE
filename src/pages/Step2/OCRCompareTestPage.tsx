import { Navigate } from "react-router-dom";

export default function OCRCompareTestPage() {
  // ✅ OCRComparePage가 기대하는 location.state 더미
  const dummyState = {
    period: { startYear: "2022", endYear: "2024" },
    years: ["2024", "2023", "2022"],
    formsByYear: {}, // 지금은 안쓰니까 빈 객체로
  };

  // react-router v6에서 element로 state를 직접 주입할 수 없어서
  // ✅ /step2/ocr-compare로 state 포함해서 "한 번" 보내고, 거기서 OCRComparePage 렌더
  return <Navigate to="/step2/ocr-compare" replace state={dummyState} />;
}