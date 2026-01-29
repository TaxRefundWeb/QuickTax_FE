import TopBar from "../layout/TopBar";
import StepperHeader from "../stepper/StepperHeader";

const STEPS = ["기본정보입력", "파일 불러오기", "계산", "완료 및 출력"];

const TOPBAR_HEIGHT = 56; // h-14
const STEPPER_HEIGHT = 60; // StepperHeader 높이(대략)
const HEADER_TOTAL = TOPBAR_HEIGHT + STEPPER_HEIGHT;

export default function StepLayout({
  activeStep,
  children,
}: {
  activeStep: number;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-white">
      {/* 고정 헤더 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white">
        <div className="w-full border-b">
          <div className="mx-auto w-full max-w-[1152px] px-6">
            <TopBar />
          </div>
        </div>

        <div className="w-full">
          <div className="mx-auto w-full max-w-[1152px] px-6">
            <StepperHeader steps={STEPS} activeStep={activeStep} />
          </div>
        </div>
      </div>

      {/* 본문 */}
      <main style={{ paddingTop: HEADER_TOTAL }} className="w-full bg-white">
        <div className="h-[calc(100vh-116px)] px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
