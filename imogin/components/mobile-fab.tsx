"use client"

import { Plus } from "lucide-react"
import { TransactionForm } from "@/components/transaction-form"

interface AccountOption {
  id: string
  name: string
  icon: string | null
  is_shared: boolean
  partnership_id: string | null
  user_id: string | null
}

interface CategoryOption {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
}

interface ProfileInfo {
  name: string | null
  email: string
  avatar_url: string | null
}

interface MobileFabProps {
  accounts: AccountOption[]
  categories: CategoryOption[]
  partnershipId: string | null
  partnerUserId: string | null
  userProfile: ProfileInfo | null
  partnerProfile: ProfileInfo | null
}

export function MobileFab({
  accounts,
  categories,
  partnershipId,
  partnerUserId,
  userProfile,
  partnerProfile,
}: MobileFabProps) {
  return (
    <div className="lg:hidden fixed bottom-20 right-4 z-50">
      <TransactionForm
        accounts={accounts}
        categories={categories}
        partnershipId={partnershipId}
        partnerUserId={partnerUserId}
        userProfile={userProfile}
        partnerProfile={partnerProfile}
        trigger={
          <button className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-colors">
            <Plus size={24} />
          </button>
        }
      />
    </div>
  )
}
