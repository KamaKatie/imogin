"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { AppContext } from "@/lib/app-context"

const AppContext = createContext<AppContext | null>(null)

export function AppContextProvider({
  data,
  children,
}: {
  data: AppContext
  children: ReactNode
}) {
  return <AppContext.Provider value={data}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContext {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error("useAppContext must be used within AppContextProvider")
  }
  return ctx
}
