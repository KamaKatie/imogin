"use client"

import { useState } from "react"
import type { Bill } from "@/lib/supabase/types-extension"

interface BillWithCategory extends Bill {
  categories: { name: string; color: string | null } | null
}

interface BillCalendarProps {
  bills: BillWithCategory[]
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function BillCalendar({ bills }: BillCalendarProps) {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear] = useState(now.getFullYear())

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const monthName = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`

  const billsByDate: Record<number, BillWithCategory[]> = {}
  for (let day = 1; day <= daysInMonth; day++) {
    billsByDate[day] = []
  }

  for (const bill of bills) {
    const billDate = new Date(bill.next_billing_date)
    if (billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear) {
      const day = billDate.getDate()
      if (billsByDate[day]) {
        billsByDate[day].push(bill)
      }
    }

    if (bill.billing_cycle === "monthly") {
      const startDay = billDate.getDate()
      if (startDay >= 1 && startDay <= daysInMonth) {
        if (billsByDate[startDay] && !billsByDate[startDay].find(s => s.id === bill.id)) {
          billsByDate[startDay].push(bill)
        }
      }
    }
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-lg font-semibold">{monthName} {currentYear}</h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      <div className="grid grid-cols-7">
        {dayNames.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-muted-foreground py-2 border-b">
            {name}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[100px] border-b border-r p-1 bg-muted/20" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${currentYear}-${currentMonth}-${day}`
          const isToday = dateStr === todayStr
          const dayBills = billsByDate[day] || []

          return (
            <div
              key={day}
              className={`min-h-[100px] border-b border-r p-1.5 transition-colors hover:bg-accent/30 ${isToday ? "bg-accent/20" : ""}`}
            >
              <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {day}
              </div>
              <div className="space-y-1">
                {dayBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="text-xs rounded px-1 py-0.5 truncate font-medium"
                    style={{
                      backgroundColor: (bill.categories?.color || "#4F46E5") + "20",
                      color: bill.categories?.color || "#4F46E5",
                    }}
                    title={`${bill.name} - ¥${Math.abs(bill.amount).toLocaleString()}`}
                  >
                    {bill.name}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t">
        <h3 className="text-sm font-semibold mb-2">Monthly Summary</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total bills</p>
            <p className="text-lg font-bold">{bills.length}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Monthly total</p>
            <p className="text-lg font-bold">
              ¥{bills.reduce((sum, s) => {
                const amt = Math.abs(s.amount)
                switch (s.billing_cycle) {
                  case "weekly": return sum + amt * 4.33
                  case "monthly": return sum + amt
                  case "quarterly": return sum + amt / 3
                  case "yearly": return sum + amt / 12
                  default: return sum
                }
              }, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
