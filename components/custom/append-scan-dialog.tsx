"use client"

import { useEffect, useState } from "react";
import { File, FileStack, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { ScanSource, ScannerCapabilities } from "@/types/printer";

const DEFAULT_DPI = 300;

function closest(values: number[], target: number) {
    return values.reduce((best, v) => Math.abs(v - target) < Math.abs(best - target) ? v : best);
}

export function AppendScanDialog({ onScan, defaultSource, defaultDpi }: {
    onScan: (source: ScanSource, dpi: number) => Promise<void>,
    defaultSource?: ScanSource,
    defaultDpi?: number,
}) {
    const [open, setOpen] = useState(false);
    const [caps, setCaps] = useState<ScannerCapabilities | null>(null);
    const [source, setSource] = useState<ScanSource>(defaultSource ?? 'Platen');
    const [dpi, setDpi] = useState(defaultDpi ?? DEFAULT_DPI);
    const [scanning, setScanning] = useState(false);

    // Load capabilities when the dialog is first opened
    useEffect(() => {
        if (!open || caps) return;
        fetch('/api/scanner-capabilities')
            .then((res) => res.ok ? res.json() : null)
            .then(setCaps)
            .catch(() => {});
    }, [open, caps]);

    // Until the capabilities are known (or if they can't be read) keep both enabled
    const hasFeeder = caps == null || caps.feeder != null;
    const hasPlaten = caps == null || caps.platen != null;
    const selectedSource: ScanSource = source === 'Feeder' && !hasFeeder ? 'Platen'
        : source === 'Platen' && !hasPlaten ? 'Feeder'
        : source;

    const sourceCaps = selectedSource === 'Feeder' ? caps?.feeder : caps?.platen;
    const resolutions = sourceCaps?.resolutions ?? [];
    // fall back to the closest supported value if the chosen one isn't offered
    const selectedDpi = resolutions.length === 0 || resolutions.includes(dpi) ? dpi : closest(resolutions, dpi);

    const handleScan = async () => {
        setScanning(true);
        try {
            await onScan(selectedSource, selectedDpi);
            setOpen(false);
        } catch {
            // onScan reports the error, keep the dialog open to retry
        } finally {
            setScanning(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !scanning && setOpen(next)}>
            <DialogTrigger asChild>
                <Button variant="info" size="sm" className="w-full">
                    <Plus /> Append Scan
                </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={!scanning}>
                <DialogHeader>
                    <DialogTitle>Append Scan</DialogTitle>
                    <DialogDescription>Scan more pages and add them to the end of this document.</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">Source</p>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant={selectedSource === 'Feeder' ? 'default' : 'outline'}
                            className="h-auto flex-col gap-2 py-4"
                            disabled={!hasFeeder || scanning}
                            onClick={() => setSource('Feeder')}
                        >
                            <FileStack className="size-5" />
                            &quot;Einzug&quot;
                        </Button>
                        <Button
                            variant={selectedSource === 'Platen' ? 'default' : 'outline'}
                            className="h-auto flex-col gap-2 py-4"
                            disabled={!hasPlaten || scanning}
                            onClick={() => setSource('Platen')}
                        >
                            <File className="size-5" />
                            &quot;Glas&quot;
                        </Button>
                    </div>
                    {!hasFeeder && (
                        <p className="text-xs text-muted-foreground">{caps?.model || 'This printer'} has no &quot;Einzug&quot;</p>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">Quality</p>
                    <Select
                        value={String(selectedDpi)}
                        onValueChange={(value) => setDpi(Number(value))}
                        disabled={resolutions.length === 0 || scanning}
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

                <DialogFooter>
                    <Button onClick={handleScan} disabled={scanning}>
                        {scanning ? <><Spinner data-icon="inline-start" /> Scanning…</> : <><Plus /> Scan &amp; Append</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
