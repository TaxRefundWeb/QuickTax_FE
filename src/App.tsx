import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import StepLayout from "./components/layout/StepLayout";

import LoginPage from "./pages/login/Login";
import AddCustomerPage from "./pages/Step1/AddCustomerPage";
import ConfirmCustomerPage from "./pages/Step1/ConfirmCustomerPage";
import ExistingCustomerPage from "./pages/Step1/ExistingCustomerPage";
import SelectPeriod from "./pages/Step1/SelectPeriod";
import OCRComparePage from "./pages/Step2/OCRComparePage";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* 로그인 */}
          <Route path="/" element={<LoginPage />} />

          {/* Step1: 신규 고객 추가 */}
          <Route
            path="/step1/add-customer"
            element={
              <StepLayout activeStep={0}>
                <AddCustomerPage />
              </StepLayout>
            }
          />

          {/* Step1: 신규 고객 확인 */}
          <Route
            path="/step1/confirm"
            element={
              <StepLayout activeStep={0}>
                <ConfirmCustomerPage />
              </StepLayout>
            }
          />

          {/* Step1: 경정청구 기간 선택 */}
          <Route
            path="/step1/period"
            element={
              <StepLayout activeStep={0}>
                <SelectPeriod />
              </StepLayout>
            }
          />

          {/* Step1: 기존 고객 입력 */}
          <Route
            path="/step1/existing"
            element={
              <StepLayout activeStep={0}>
                <ExistingCustomerPage />
              </StepLayout>
            }
          />

          {/* ✅ Step2: OCR 인식 결과 비교 */}
          <Route
            path="/step2/ocr-compare"
            element={
              <StepLayout activeStep={1}>
                <OCRComparePage />
              </StepLayout>
            }
          />

          {/* 없는 경로는 로그인으로 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
