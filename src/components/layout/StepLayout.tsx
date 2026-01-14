import StepperHeader from "../stepper/StepperHeader";

const STEPS = ["기본정보입력", "파일 불러오기", "계산", "완료 및 출력"];

// TopBar 높이: h-14 (56px)
// StepperHeader 높이(대략): py-6 + 점/텍스트 포함해서 약 88px 전후
// 그래서 컨텐츠는 대충 56 + 88 = 144px 정도 아래로 내려주면 안전함.
// (필요하면 pt 값을 조금씩 조절하면 됨)
const TOPBAR_HEIGHT = 56;
const STEPPER_HEIGHT = 88;
const HEADER_TOTAL = TOPBAR_HEIGHT + STEPPER_HEIGHT; // 144

export default function StepLayout({
  activeStep,
  children,
}: {
  activeStep: number;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      {/* StepperHeader는 fixed로 화면 기준 풀폭 고정 */}
      <StepperHeader steps={STEPS} activeStep={activeStep} />

      {/* 헤더(TopBar + StepperHeader) 아래로 컨텐츠 밀기 */}
      <main style={{ paddingTop: HEADER_TOTAL }} className="w-full px-10 py-8">
        {children}

        {/* 
          만약 콘텐츠를 가운데에 두고 폭 제한하고 싶으면 이렇게:
          <div className="max-w-5xl mx-auto">{children}</div>
        */}
      </main>
    </div>
  );
}
