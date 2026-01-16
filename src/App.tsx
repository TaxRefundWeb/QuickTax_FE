import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import StepLayout from "./components/layout/StepLayout";

import AddCustomerPage from "./pages/Step1/AddCustomerPage";
import ConfirmCustomerPage from "./pages/Step1/ConfirmCustomerPage";

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
        {/* 처음 들어오면 Step1 Add로 보내기 */}
        <Route path="/" element={<Navigate to="/step1/add" replace />} />

        <Route
          path="/step1/add"
          element={
            <Step1Layout>
              <AddCustomerPage />
            </Step1Layout>
          }
        />

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
