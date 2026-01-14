import AppLayout from "./components/layout/AppLayout";
import StepLayout from "./components/layout/StepLayout";
import AddCustomerPage from "./pages/Step1/AddCustomerPage";

export default function App() {
  return (
    <AppLayout>
      <StepLayout activeStep={0}>
        <AddCustomerPage />
      </StepLayout>
    </AppLayout>
  );
}
