'use client'

import { PlanCard } from './plan-card'
import type { Tier } from '@/lib/queries/subscriptions'

interface PlansGridProps {
  tiers: Tier[]
  currentTierId?: number
}

export function PlansGrid({ tiers, currentTierId }: PlansGridProps) {
  // Find the middle tier (usually the "popular" one)
  const popularTierIndex = Math.floor(tiers.length / 2)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {tiers.map((tier, index) => (
        <PlanCard
          key={tier.id}
          tier={tier}
          isCurrentTier={tier.id === currentTierId}
          isPopular={index === popularTierIndex && tier.price_monthly > 0}
        />
      ))}
    </div>
  )
}


