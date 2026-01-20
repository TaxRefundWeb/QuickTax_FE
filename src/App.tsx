import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import StepLayout from "./components/layout/StepLayout";

import LoginPage from "./pages/login/Login";

import AddCustomerPage from "./pages/Step1/AddCustomerPage";
import ConfirmCustomerPage from "./pages/Step1/ConfirmCustomerPage";
import ExistingCustomerPage from "./pages/Step1/ExistingCustomerPage";
import ConfirmExistingPage from "./pages/Step1/ConfirmExistingPage";

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
        {/* 로그인 */}
        <Route path="/" element={<LoginPage />} />

        {/* ✅ 기존 고객 입력 */}
        <Route
          path="/step1/existing"
          element={
            <Step1Layout>
              <ExistingCustomerPage />
            </Step1Layout>
          }
        />

        {/* ✅ 기존 고객 확인 */}
        <Route
          path="/step1/existing/confirm"
          element={
            <Step1Layout>
              <ConfirmExistingPage />
            </Step1Layout>
          }
        />

        {/* ✅ 신규 고객 입력 */}
        <Route
          path="/step1/add"
          element={
            <Step1Layout>
              <AddCustomerPage />
            </Step1Layout>
          }
        />

        {/* ✅ 신규 고객 확인 */}
        <Route
          path="/step1/confirm"
          element={
            <Step1Layout>
              <ConfirmCustomerPage />
            </Step1Layout>
          }
        />

        {/* 없는 경로는 로그인으로 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
