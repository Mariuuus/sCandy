"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ScannerCapabilities } from "@/types/printer"
import { File, FileStack } from "lucide-react"
import { useRouter } from "next/navigation"
import { ReactNode, useEffect, useState } from "react"

export function Navbar() {
  return (
    <div className="m-5 mb-10 text-center ">
      <h1>
        sCandy
      </h1>
    </div>
  )
}

export function BigIconButton({children, href, disabled, disabledReason} : {children: ReactNode, href: string, disabled?: boolean, disabledReason?: string}) {
  const router = useRouter()

  const button = (
    <Button variant={"default"} className="h-auto w-full flex-col gap-3 py-6 text-base" disabled={disabled} onClick={() => {router.push(href)}}>
      {children}
    </Button>
  )

  if (!disabled || !disabledReason) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex w-full cursor-not-allowed">
          {button}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{disabledReason}</p>
      </TooltipContent>
    </Tooltip>
  )
}


export default function Home() {
  const [caps, setCaps] = useState<ScannerCapabilities | null>(null)

  useEffect(() => {
    fetch('/api/scanner-capabilities')
      .then((res) => res.ok ? res.json() : null)
      .then(setCaps)
      .catch(() => {})
  }, [])

  // Until the capabilities are known (or if they can't be read) keep both enabled
  const noFeeder = caps != null && caps.feeder == null
  const noPlaten = caps != null && caps.platen == null

  return <div className="md:col-span-2 grid grid-cols-2 mt-4">
      <BigIconButton href="/scan?type=Feeder" disabled={noFeeder} disabledReason={`${caps?.model || 'This printer'} has no "Einzug"`}>
        <FileStack  className="size-6" />
        Scan from &quot;Einzug&quot;
      </BigIconButton>
      <BigIconButton href="/scan?type=Platen" disabled={noPlaten} disabledReason={`${caps?.model || 'This printer'} has no scanner glass`}>
        <File  className="size-6"/>
        Scan from &quot;Glas&quot;
      </BigIconButton>
  </div>
}
