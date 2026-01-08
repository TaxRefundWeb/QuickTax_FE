import AppLayout from "./components/layout/AppLayout";
import StepLayout from "./components/layout/StepLayout";

export default function App() {
  return (
    <AppLayout>
      <StepLayout activeStep={0}>
        <div className="bg-white p-10 rounded shadow">
          Step 1 내용
        </div>
      </StepLayout>
    </AppLayout>
  );
}
