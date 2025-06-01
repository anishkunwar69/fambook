'use client'

import { signOut } from "next-auth/react"
import { Button } from "./ui/button"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  return (
    <Button
      onClick={() => signOut({ callbackUrl: "/" })}
      variant="outline"
      className="flex items-center gap-2 hover:bg-rose-50"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </Button>
  )
} 