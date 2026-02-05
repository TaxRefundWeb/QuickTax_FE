import React, { createContext, useContext, useMemo, useState } from "react";
import type { Customer } from "../lib/api/customers";

type Ctx = {
  // LoginModal (고객 목록)
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;

  // StartModal
  isStartModalOpen: boolean;
  openStartModal: () => void;
  closeStartModal: () => void;

  // HistoryModal
  isHistoryModalOpen: boolean;
  openHistoryModal: () => void;
  closeHistoryModal: () => void;

  // 선택 고객
  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer | null) => void;

  // 흐름 편의 함수
  pickCustomerAndOpenStart: (c: Customer) => void; // 고객 선택 → StartModal
  backToCustomerList: () => void;                  // Start → 고객목록
  goHistoryFromStart: () => void;                  // Start → History
};

const CustomerFlowContext = createContext<Ctx | null>(null);

export function CustomerListModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isStartModalOpen, setStartModalOpen] = useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const value = useMemo<Ctx>(() => {
    const openLoginModal = () => setLoginModalOpen(true);
    const closeLoginModal = () => setLoginModalOpen(false);

    const openStartModal = () => setStartModalOpen(true);
    const closeStartModal = () => setStartModalOpen(false);

    const openHistoryModal = () => setHistoryModalOpen(true);
    const closeHistoryModal = () => setHistoryModalOpen(false);

    const pickCustomerAndOpenStart = (c: Customer) => {
      setSelectedCustomer(c);
      setLoginModalOpen(false);
      setStartModalOpen(true);
    };

    const backToCustomerList = () => {
      setStartModalOpen(false);
      setLoginModalOpen(true);
    };

    const goHistoryFromStart = () => {
      if (!selectedCustomer) return;
      setStartModalOpen(false);
      setHistoryModalOpen(true);
    };

    return {
      isLoginModalOpen,
      openLoginModal,
      closeLoginModal,

      isStartModalOpen,
      openStartModal,
      closeStartModal,

      isHistoryModalOpen,
      openHistoryModal,
      closeHistoryModal,

      selectedCustomer,
      setSelectedCustomer,

      pickCustomerAndOpenStart,
      backToCustomerList,
      goHistoryFromStart,
    };
  }, [isLoginModalOpen, isStartModalOpen, isHistoryModalOpen, selectedCustomer]);

  return (
    <CustomerFlowContext.Provider value={value}>
      {children}
    </CustomerFlowContext.Provider>
  );
}

export function useCustomerListModal() {
  const ctx = useContext(CustomerFlowContext);
  if (!ctx) throw new Error("useCustomerListModal must be used within Provider");
  return ctx;
}