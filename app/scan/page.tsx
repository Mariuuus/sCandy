"use client"

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { PDFDocument } from "pdf-lib";

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

const PdfViewer = dynamic(
    () => import("@/components/custom/pdf-viewer").then(m => m.PdfViewer),
    { ssr: false }
);

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { Download, Edit, Plus, Upload } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppendScanDialog } from "@/components/custom/append-scan-dialog";
import type { ScanSource } from "@/types/printer";

async function requestScan(source: ScanSource, dpi?: number): Promise<Blob> {
    const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, dpi }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Scan failed');
    }
    return res.blob();
}

async function mergePdfs(first: Blob, second: Blob): Promise<Blob> {
    const merged = await PDFDocument.load(await first.arrayBuffer());
    const appended = await PDFDocument.load(await second.arrayBuffer());
    const pages = await merged.copyPages(appended, appended.getPageIndices());
    pages.forEach(page => merged.addPage(page));
    const bytes = await merged.save();
    return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

const ScanPageInner = () => {

    const [error, setError] = useState<null|string>(null);
    const [url, setUrl] = useState<null|string>(null);
    const [filename, setFilename] = useState('NAME_ME');
    const [uploading, setUploading] = useState(false);
    const router = useRouter();
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '_') + '_';

    const startScan = async () => {
        try {
            const blob = await requestScan(type as ScanSource, Number(dpi) || undefined);
            setUrl(URL.createObjectURL(blob));
        } catch (err) {
            setError((err as Error).message);
        }
    }

    // Errors are shown here and re-thrown so the dialog stays open
    const appendScan = async (source: ScanSource, scanDpi: number) => {
        if (!url) return;
        try {
            const [current, scanned] = await Promise.all([
                fetch(url).then(r => r.blob()),
                requestScan(source, scanDpi),
            ]);
            const merged = await mergePdfs(current, scanned);
            setUrl(URL.createObjectURL(merged));
            toast.success('Scan appended');
        } catch (err) {
            toast.error((err as Error).message || 'Append failed');
            throw err;
        }
    }

    const downloadBlob = () => {
        if (!url) return;
        const a = document.createElement('a')
        a.href = url
        a.download = datePrefix + filename + '.pdf'
        a.click()
    }

    const uploadScan = async (blobUrl: string, name: string) => {
        const blob = await fetch(blobUrl).then(r => r.blob());
        const formData = new FormData();
        formData.append('file', blob, name);
        formData.append('name', name);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        return res.json();
    }

    const handleUpload = async () => {
        if (!url) return;
        const intendedName = datePrefix + filename + '.pdf';
        setUploading(true);
        try {
            const data = await uploadScan(url, intendedName);
            if (data.success) {
                if (data.filename !== intendedName) {
                    toast.info(`Saved as "${data.filename}" (name was already taken)`);
                } else {
                    toast.success(`Uploaded as "${data.filename}"`);
                }
            } else {
                toast.error(data.error ?? 'Upload failed');
            }
        } catch {
            toast.error('Upload failed — check your connection');
        } finally {
            setUploading(false);
        }
    }

    const searchParams = useSearchParams()
 
    const type = searchParams.get('type')
    const dpi = searchParams.get('dpi')
    const documentUrl = searchParams.get('document')

    const loadAsBlob = (src: string) =>
        fetch(src)
            .then(r => r.blob())
            .then(blob => setUrl(URL.createObjectURL(blob)))
            .catch(() => setError('Failed to load document'));

    useEffect(() => {
        setError(null)
        if (!documentUrl && type) {
            setUrl(null)
            startScan();
        } else if (documentUrl) {
            loadAsBlob(documentUrl);
        }
    },[])


    return <>
        {url == null
            ? <div className="col-span-2 flex flex-col items-center justify-center gap-3 py-20">
                <Spinner />
                <div className="text-center">
                    <p className="text-sm font-medium">Scanning document…</p>
                    <p className="text-xs text-muted-foreground">This can take a moment</p>
                </div>
            </div>
            : <>
                <Card className="mx-auto w-full overflow-hidden">
                    <CardHeader className="border-b px-4 py-3">
                        <CardTitle className="text-sm">Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <PdfViewer url={url} />
                    </CardContent>
                </Card>

                <Card className="mx-auto w-full">
                    <CardHeader className="border-b px-4 py-3">
                        <CardTitle className="text-sm">Actions</CardTitle>
                        <CardDescription>Manage your scanned document</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6 px-4">
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-medium  tracking-wide text-muted-foreground">Edit</p>
                            <div className="grid grid-cols-3 gap-2">
                                <Button variant="info" size="sm" className="w-full" onClick={() => url && router.push('/scan/edit?document=' + encodeURIComponent(url))}>
                                    <Edit /> Edit Pages
                                </Button>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="inline-flex w-full cursor-not-allowed">
                                            <Button variant="info" size="sm" className="w-full pointer-events-none" disabled>
                                                <Plus /> Add Duplex
                                            </Button>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Coming Soon</p>
                                    </TooltipContent>
                                </Tooltip>
                                <AppendScanDialog
                                    onScan={appendScan}
                                    defaultSource={type === 'Feeder' ? 'Feeder' : 'Platen'}
                                    defaultDpi={Number(dpi) || undefined}
                                />
                                
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-medium  tracking-wide text-muted-foreground">Export</p>
                            <ButtonGroup className="w-full">
                                <ButtonGroupText className="shrink-0">{datePrefix}</ButtonGroupText>
                                <input
                                    value={filename}
                                    onChange={e => setFilename(e.target.value)}
                                    className="min-w-0 flex-1 border border-input bg-background px-2.5 py-2 text-xs font-medium focus-visible:border-ring"
                                />
                                <ButtonGroupText>.pdf</ButtonGroupText>
                            </ButtonGroup>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="success" size="sm" onClick={downloadBlob} className="w-full">
                                    <Download /> Download
                                </Button>
                                <Button variant="success" size="sm" className="w-full" onClick={handleUpload} disabled={uploading}>
                                    <Upload /> {uploading ? 'Uploading…' : 'Upload'}
                                </Button>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </>
        }
    </>
}

const ScanPage = () => (
    <Suspense>
        <ScanPageInner />
    </Suspense>
);

export default ScanPage;