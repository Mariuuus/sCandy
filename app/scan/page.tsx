"use client"

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const PdfViewer = dynamic(
    () => import("@/components/custom/pdf-viewer").then(m => m.PdfViewer),
    { ssr: false }
);

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { Download, Edit, Plus, Upload } from "lucide-react";

const ScanPage = () => {

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
        if (!url) return;
        let downloadUrl = url;
        let isObjectUrl = false;
        if (!url.startsWith('blob:')) {
            const blob = await fetch(url).then(r => r.blob());
            downloadUrl = URL.createObjectURL(blob);
            isObjectUrl = true;
        }
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = new Date().toISOString().slice(0, 10).replace(/-/g, '_') + '_NAMEME.pdf'
        a.click()
        if (isObjectUrl) URL.revokeObjectURL(downloadUrl);
    }

    const searchParams = useSearchParams()
 
    const type = searchParams.get('type')
    const documentUrl = searchParams.get('document')

    useEffect(() => {
        setError(null)
        if(!documentUrl && type) {
            setUrl(null)
            startScan();
        } else {
            setUrl(documentUrl)
        }
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
                <CardHeader >
                    <CardTitle className="text-center">Document</CardTitle>
                </CardHeader>
                <CardContent>
                    <PdfViewer url={url} />
                </CardContent>
            </Card>
            <Card className="mx-auto w-full">
                <CardHeader className="text-center">
                    <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="">
                        You can now easily download the document or edit it.
                    </p>
                </CardContent>
                <CardFooter>
                <div className="md:grid md:grid-cols-2 w-full">
                    <Button variant={"info"} className="w-full">
                        <Edit></Edit> Edit Pages
                    </Button>
                    <Button variant={"info"} className="w-full">
                        <Plus></Plus> Add Duplex Scan
                    </Button>
                    <div className="h-2 col-span-2"></div>
                    <Button variant="success" onClick={downloadBlob} className="w-full">
                        <Download></Download> Download
                    </Button>
                    <Button variant={"success"} className="w-full" >
                        <Upload></Upload> Upload to Server
                    </Button>
                </div>
                </CardFooter>
            </Card>
        </>
        }
    </>
}

export default ScanPage;