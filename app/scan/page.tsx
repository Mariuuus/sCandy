"use client"

import { useEffect, useState } from "react";

import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { Download, Edit } from "lucide-react";

const Page = () => {

    const [error, setError] = useState<null|string>(null);
    const [url, setUrl] = useState<null|string>(null);

    const startScan = async () => {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: type }),
        });
        if(res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setUrl(url)
        } else {
            setError((await res.json()).error)
        }
    }

    const downloadBlob = async () => {
        const a = document.createElement('a')
        a.href = url
        a.download = new Date().toISOString().slice(0, 10).replace(/-/g, '_') +'_NAMEME.pdf'
        a.click()
    }

    const searchParams = useSearchParams()
 
    const type = searchParams.get('type')

    useEffect(() => {
        setUrl(null)
        setError(null)
        startScan();
    },[])

    return <>
        { url == null ? <div className="col-span-2 mt-2"> 
            <div className="flex justify-center">
                <div className="flex flex-col items-center">
                    <Spinner data-icon="inline-start" />
                    <span>Scanning</span>
                    <small>(This can take some time)</small>
                </div>
            </div>
        </div>

        :
        <>
            <Card className="mx-auto w-full">
                <CardHeader>
                    <CardTitle>Document</CardTitle>
                </CardHeader>
            </Card>
            <Card className="mx-auto w-full">
                <CardHeader>
                    <CardTitle>Document Scanned!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="">
                        You can now easily download the document or edit it.
                    </p>
                </CardContent>
                <CardFooter>
                <div className="grid grid-cols-2 w-full">
                    <Button variant="success" onClick={downloadBlob}>
                        <Download></Download> Download
                    </Button>
                    <Button variant={"warning"}>
                        <Edit></Edit> Edit
                    </Button>
                </div>
                </CardFooter>
            </Card>
        </>
        }
    </>
}

export default Page;