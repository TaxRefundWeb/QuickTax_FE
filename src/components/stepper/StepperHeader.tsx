type StepperHeaderProps = {
  steps: string[];
  activeStep: number;
};

export default function StepperHeader({ steps, activeStep }: StepperHeaderProps) {
  const progressPercent =
    steps.length <= 1 ? 0 : (activeStep / (steps.length - 1)) * 100;

  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-white border-b">
      <div className="w-full px-10 py-6">
        <div className="relative w-full">
          <div className="absolute left-0 right-0 top-[6px] h-[2px] bg-gray-300" />
          <div
            className="absolute left-0 top-[6px] h-[2px] bg-blue-500"
            style={{ width: `${progressPercent}%` }}
          />
          <div className="relative z-10 flex w-full">
            {steps.map((label, idx) => {
              const isActive = idx === activeStep;
              const isDone = idx < activeStep;

              return (
                <div key={label} className="flex-1 flex flex-col items-center min-w-0">
                  <div className={`w-3 h-3 rounded-full ${isActive || isDone ? "bg-blue-500" : "bg-gray-300"}`} />
                  <span className={`mt-2 text-xs whitespace-nowrap ${isActive ? "text-blue-600 font-semibold" : "text-gray-600"}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
