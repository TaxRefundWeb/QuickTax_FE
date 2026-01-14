import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import StepLayout from "./components/layout/StepLayout";

import LoginPage from "./pages/login/Login";
import AddCustomerPage from "./pages/Step1/AddCustomerPage";

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

          {/* 없는 경로는 로그인으로 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
