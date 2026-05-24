"use client"

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { PDFDocument } from "pdf-lib";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PdfEditor = dynamic(
    () => import("@/components/custom/pdf-editor").then(m => m.PdfEditor),
    { ssr: false }
);

const EditPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pdfUrl = searchParams.get('document');

    const [pageOrder, setPageOrder] = useState<number[]>([]);
    const [finishing, setFinishing] = useState(false);

    const finishEditing = async () => {
        if (!pdfUrl || pageOrder.length === 0) return;
        setFinishing(true);
        try {
            const srcBytes = await fetch(pdfUrl).then(r => r.arrayBuffer());
            const srcDoc = await PDFDocument.load(srcBytes);
            const newDoc = await PDFDocument.create();
            const copied = await newDoc.copyPages(srcDoc, pageOrder.map(p => p - 1));
            copied.forEach(page => newDoc.addPage(page));
            const outBytes = await newDoc.save();
            const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            router.push('/scan?document=' + encodeURIComponent(blobUrl));
        } finally {
            setFinishing(false);
        }
    };

    if (!pdfUrl) return (
        <div className="col-span-2 flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">No document provided.</p>
        </div>
    );

    return (
        <Card className="col-span-2 w-full overflow-hidden">
            <CardHeader className="border-b px-4 py-3">
                <CardTitle className="text-sm">Edit Pages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <PdfEditor url={pdfUrl} onReorder={setPageOrder} />
            </CardContent>
            <CardFooter className="border-t px-4 py-3">
                <Button
                    variant="success"
                    size="sm"
                    disabled={pageOrder.length === 0 || finishing}
                    onClick={finishEditing}
                    className="ml-auto"
                >
                    <Check />
                    {finishing ? 'Rebuilding PDF…' : 'Finish Editing'}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default EditPage;
