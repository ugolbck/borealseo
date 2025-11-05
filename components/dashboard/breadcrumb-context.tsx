"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface BreadcrumbContextType {
  articleTitle: string | null;
  setArticleTitle: (title: string | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  articleTitle: null,
  setArticleTitle: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [articleTitle, setArticleTitle] = useState<string | null>(null);

  return (
    <BreadcrumbContext.Provider value={{ articleTitle, setArticleTitle }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}
