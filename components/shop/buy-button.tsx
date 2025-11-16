'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BuyButtonProps {
  productId: string
  productType: 'file' | 'bundle'
  isPurchased: boolean
  isAuthenticated: boolean
}

export function BuyButton({ productId, productType, isPurchased, isAuthenticated }: BuyButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleBuy = async () => {
    if (!isAuthenticated) {
      const param = productType === 'file' ? `fileProductId=${productId}` : `productId=${productId}`
      router.push(`/login?redirect=/loja&${param}`)
      return
    }

    if (isPurchased) {
      return
    }

    setIsLoading(true)

    try {
      const endpoint = productType === 'file' ? '/api/stripe/checkout-file' : '/api/stripe/checkout-product'
      const bodyKey = productType === 'file' ? 'fileProductId' : 'productId'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [bodyKey]: productId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar compra')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Error initiating checkout:', error)
      alert(error.message || 'Erro ao processar compra. Tente novamente.')
      setIsLoading(false)
    }
  }

  if (isPurchased) {
    return (
      <button
        disabled
        className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg cursor-not-allowed"
      >
        Já Comprado
      </button>
    )
  }

  return (
    <button
      onClick={handleBuy}
      disabled={isLoading}
      className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Processando...' : 'Comprar'}
    </button>
  )
}

