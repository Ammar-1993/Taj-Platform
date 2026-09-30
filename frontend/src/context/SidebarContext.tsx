"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: true,
  setIsCollapsed: () => {},
  toggleSidebar: () => {},
});

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always default to collapsed (true) whenever entering the dashboard
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  // Clear any legacy localStorage value to prevent unexpected expansion
  useEffect(() => {
    try {
      localStorage.removeItem("taj_sidebar_collapsed");
    } catch {
      // Ignore in restricted environments
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
