"use client"

import { Button } from "@/components/ui/button"
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
  return <div className="md:col-span-2 grid grid-cols-2 mt-4">
      <BigIconButton href="/scan?type=Feeder">
        <FileStack  className="size-6" />
        Scan from "Einzug"
      </BigIconButton>
      <BigIconButton href="/scan?type=Platen">
        <File  className="size-6"/>
        Scan from "Glas"
      </BigIconButton>
  </div>
}

