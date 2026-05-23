"use client"

import PrinterCard from "@/components/custom/printer-card"
import { EinzugIcon, GlasIcon } from "@/components/custom/scanner-icons"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { File, FileStack } from "lucide-react"
import { useRouter } from "next/navigation"
import { ReactNode } from "react"

export function Navbar() {
  return (
    <div className="m-5 mb-10 text-center ">
      <h1>
        sCandy
      </h1>
    </div>
  )
}

export function BigIconButton({children, href} : {children: ReactNode, href: string}) {
  const router = useRouter()

  return (
    <Button variant={"default"} className="h-auto flex-col gap-3 py-6 text-base" onClick={() => {router.push(href)}}>
      {children}
    </Button>
  )
}


export default function Home() {
  return <>
      <BigIconButton href="/scan?type=Feeder">
        <FileStack  className="size-6" />
        Scan from "Einzug"
      </BigIconButton>
      <BigIconButton href="/scan?type=Platen">
        <File  className="size-6"/>
        Scan from "Glas"
      </BigIconButton>
  </>
}

