type StepperHeaderProps = {
  steps: string[];
  activeStep: number; // 0 ~ steps.length - 1
};

export default function StepperHeader({
  steps,
  activeStep,
}: StepperHeaderProps) {
  return (
    <div className="w-full bg-white py-6">
      <div className="w-full">
        {/* ====== 구간형 선 ====== */}
        <div className="flex w-full gap-3">
          {steps.map((label, idx) => {
            const isDoneOrActive = idx <= activeStep;

            return (
              <div key={label} className="flex-1">
                {/* 선 */}
                <div
                  className={`h-[4px] w-full rounded-full ${
                    isDoneOrActive ? "bg-blue-500" : "bg-gray-300"
                  }`}
                />

                {/* 라벨 */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-xs ${
                      idx === activeStep
                        ? "text-blue-600 font-semibold"
                        : isDoneOrActive
                        ? "text-blue-500"
                        : "text-gray-600"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
