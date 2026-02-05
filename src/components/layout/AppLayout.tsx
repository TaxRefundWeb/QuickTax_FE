import React from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";

import LoginModal from "../modal/LoginModal";
import StartModal from "../modal/StartModal";
import HistoryModal from "../modal/HistoryModal";

import { useCustomerListModal } from "../../contexts/customerListModalContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const {
    isLoginModalOpen,
    closeLoginModal,

    isStartModalOpen,
    openStartModal,
    closeStartModal,
    backToCustomerList,
    goHistoryFromStart,

    isHistoryModalOpen,
    closeHistoryModal,

    selectedCustomer,
    pickCustomerAndOpenStart,
  } = useCustomerListModal();

  return (
    <div className="min-h-screen w-full bg-white">
      <TopBar />
      {children}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onAddCustomer={() => {
          closeLoginModal();
          navigate("/step1/add-customer");
        }}
        onOpenStartModal={(customer) => {
          pickCustomerAndOpenStart(customer);
        }}
        closeOnBackdropClick={false}
        closeOnEsc={false}
      />

      <StartModal
        open={isStartModalOpen}
        userName={selectedCustomer?.name ?? "OOO"}
        onClose={closeStartModal}
        onLoadPrevious={goHistoryFromStart}
        onBack={backToCustomerList}
        onStartNew={() => {
          if (!selectedCustomer) return;
          closeStartModal();
          navigate("/step1/confirm", {
            state: { customerId: selectedCustomer.customerId },
          });
        }}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          closeHistoryModal();
          openStartModal();   // History 닫으면 Start로 복귀
        }}
        customer={selectedCustomer}
        onStartNew={() => {
          if (!selectedCustomer) return;
          closeHistoryModal();
          navigate("/step1/confirm", {
            state: { customerId: selectedCustomer.customerId },
          });
        }}
      />
    </div>
  );
}