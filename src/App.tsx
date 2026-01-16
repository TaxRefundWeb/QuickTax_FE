import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import StepLayout from "./components/layout/StepLayout";

import AddCustomerPage from "./pages/Step1/AddCustomerPage";
import ConfirmCustomerPage from "./pages/Step1/ConfirmCustomerPage";
import ExistingCustomerPage from "./pages/Step1/ExistingCustomerPage";
import ConfirmExistingPage from "./pages/Step1/ConfirmExistingPage"; // ✅ 추가

function Step1Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      <StepLayout activeStep={0}>{children}</StepLayout>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ 확인용: 처음 들어오면 ExistingCustomerPage로 보내기 */}
        <Route path="/" element={<Navigate to="/step1/existing" replace />} />

        {/* ✅ 기존 고객 입력 */}
        <Route
          path="/step1/existing"
          element={
            <Step1Layout>
              <ExistingCustomerPage />
            </Step1Layout>
          }
        />

        {/* ✅ 기존 고객 확인 (추가) */}
        <Route
          path="/step1/existing/confirm"
          element={
            <Step1Layout>
              <ConfirmExistingPage />
            </Step1Layout>
          }
        />

        {/* 신규 고객 입력 */}
        <Route
          path="/step1/add"
          element={
            <Step1Layout>
              <AddCustomerPage />
            </Step1Layout>
          }
        />

        {/* 신규 고객 확인 */}
        <Route
          path="/step1/confirm"
          element={
            <Step1Layout>
              <ConfirmCustomerPage />
            </Step1Layout>
          }
        />

        {/* 없는 경로는 홈으로 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
