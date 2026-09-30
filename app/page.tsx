"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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


const DEFAULT_DPI = 300

// DPI values every available source can scan with, so the choice is valid
// whichever button is pressed afterwards
function supportedResolutions(caps: ScannerCapabilities | null): number[] {
  const sources = [caps?.platen, caps?.feeder].filter((s) => s != null)
  if (sources.length === 0) return []
  return sources[0].resolutions.filter((dpi) => sources.every((s) => s.resolutions.includes(dpi)))
}

export default function Home() {
  const [caps, setCaps] = useState<ScannerCapabilities | null>(null)
  const [dpi, setDpi] = useState(DEFAULT_DPI)

  useEffect(() => {
    fetch('/api/scanner-capabilities')
      .then((res) => res.ok ? res.json() : null)
      .then(setCaps)
      .catch(() => {})
  }, [])

  // Until the capabilities are known (or if they can't be read) keep both enabled
  const noFeeder = caps != null && caps.feeder == null
  const noPlaten = caps != null && caps.platen == null

  const resolutions = supportedResolutions(caps)
  // fall back to the closest supported value if the default isn't offered
  const selectedDpi = resolutions.length === 0 || resolutions.includes(dpi)
    ? dpi
    : resolutions.reduce((best, r) => Math.abs(r - dpi) < Math.abs(best - dpi) ? r : best)

  return <div className="md:col-span-2 grid grid-cols-2 mt-4">
      <div className="col-span-2 mb-4 flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">Quality</p>
        <Select
          value={String(selectedDpi)}
          onValueChange={(value) => setDpi(Number(value))}
          disabled={resolutions.length === 0}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder={`${DEFAULT_DPI} dpi`} />
          </SelectTrigger>
          <SelectContent>
            {resolutions.map((r) => (
              <SelectItem key={r} value={String(r)}>{r} dpi</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <BigIconButton href={`/scan?type=Feeder&dpi=${selectedDpi}`} disabled={noFeeder} disabledReason={`${caps?.model || 'This printer'} has no "Einzug"`}>
        <FileStack  className="size-6" />
        Scan from &quot;Einzug&quot;
      </BigIconButton>
      <BigIconButton href={`/scan?type=Platen&dpi=${selectedDpi}`} disabled={noPlaten} disabledReason={`${caps?.model || 'This printer'} has no scanner glass`}>
        <File  className="size-6"/>
        Scan from &quot;Glas&quot;
      </BigIconButton>
  </div>
}
