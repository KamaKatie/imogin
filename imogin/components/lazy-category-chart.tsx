"use client"

import dynamic from "next/dynamic"

export const LazyCategoryBarChart = dynamic(
  () => import("@/components/category-bar-chart").then((m) => m.CategoryBarChart),
  {
    loading: () => (
      <div className="h-64 bg-muted rounded-lg animate-pulse" />
    ),
    ssr: false,
  },
)
