"use client"

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Reorder } from "motion/react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const THUMB_HEIGHT = 260;

export function PdfEditor({ url, onReorder }: { url: string; onReorder?: (order: number[]) => void }) {
    const [pageOrder, setPageOrder] = useState<number[]>([]);
    const [loadError, setLoadError] = useState(false);

    const handleReorder = (order: number[]) => {
        setPageOrder(order);
        onReorder?.(order);
    };

    const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
        setLoadError(false);
        const initial = Array.from({ length: numPages }, (_, i) => i + 1);
        setPageOrder(initial);
        onReorder?.(initial);
    };

    if (loadError) return (
        <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
            Could not load document — the link may have expired. Go back and try again.
        </div>
    );

    return (
        <Document
            file={url}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={() => setLoadError(true)}
        >
            <div className="overflow-x-auto">
                <Reorder.Group
                    axis="x"
                    values={pageOrder}
                    onReorder={handleReorder}
                    className="flex w-max gap-3 p-4"
                    style={{ height: THUMB_HEIGHT + 48 }}
                >
                    {pageOrder.map(pageNum => (
                        <Reorder.Item
                            key={pageNum}
                            value={pageNum}
                            className="shrink-0 cursor-grab active:cursor-grabbing select-none"
                        >
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="overflow-hidden rounded border border-border shadow-sm">
                                    <Page
                                        pageNumber={pageNum}
                                        height={THUMB_HEIGHT}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {pageNum}
                                </span>
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            </div>
        </Document>
    );
}
