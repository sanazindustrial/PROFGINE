"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, Zap } from "lucide-react"

interface TrialExpiredBannerProps {
  remainingDays?: number
  className?: string
}

export function TrialExpiredBanner({ remainingDays = 0, className = "" }: TrialExpiredBannerProps) {
  const router = useRouter()

  if (remainingDays > 0) {
    return (
      <Card className={`border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg text-yellow-800">
            <Clock className="size-5" />
            Trial Ending Soon
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-yellow-700">
              Your free trial expires in <strong>{remainingDays} day{remainingDays !== 1 ? 's' : ''}</strong>
            </p>
            <p className="text-sm text-yellow-600">
              Upgrade now to keep all your data and continue using unlimited features.
            </p>
          </div>
          <Button
            onClick={() => router.push('/subscription/upgrade')}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            <Zap className="mr-2 size-4" />
            Upgrade Now
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-red-200 bg-gradient-to-r from-red-50 to-orange-50 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-red-800">
          <AlertTriangle className="size-5" />
          Trial Expired
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-red-700">
            Your free trial has ended. Upgrade now to continue using ProfGenie.
          </p>
          <p className="text-sm text-red-600">
            Your data is safely stored and will be available immediately after upgrading.
          </p>
        </div>
        <Button
          onClick={() => router.push('/subscription/upgrade')}
          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
        >
          <Zap className="mr-2 size-4" />
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  )
}

export default TrialExpiredBanner