"use client"

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { ChevronLeft, ChevronRight } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

export function PdfViewer({ url }: { url: string }) {
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(([entry]) => {
            setContainerWidth(entry.contentRect.width);
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="flex flex-col items-center">
            {numPages > 0 && (
                <ButtonGroup className="w-full">
                    <Button
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeft />
                    </Button>
                    <ButtonGroupText className="flex-1 justify-center">
                        Page {currentPage}/{numPages}
                    </ButtonGroupText>
                    <Button
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                        disabled={currentPage >= numPages}
                    >
                        <ChevronRight />
                    </Button>
                </ButtonGroup>
            )}
            <Document
                file={url}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            >
                <Page pageNumber={currentPage} width={containerWidth || undefined} />
            </Document>
        </div>
    );
}
