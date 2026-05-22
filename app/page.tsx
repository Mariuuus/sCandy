import PrinterCard from "@/components/custom/printer-card"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function Navbar() {
  return (
    <div className="m-5 mb-10 text-center ">
      <h1>
        sCandy
      </h1>
    </div>
  )
}

export default function Home() {
  return <>
    <Navbar></Navbar>
    <div className="max-w-4xl w-full self-center">
      <PrinterCard></PrinterCard>
    </div>
  </>
}

