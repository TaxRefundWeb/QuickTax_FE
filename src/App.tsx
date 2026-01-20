import { useState } from "react";
import StartModal from "./components/modal/StartModal";

export default function App() {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* 기존 App 내용 그대로 */}
      <StartModal
        open={open}
        userName="김범수"
        onClose={() => setOpen(false)}
        onLoadPrevious={() => setOpen(false)}
        onStartNew={() => setOpen(false)}
      />
    </>
  );
}
