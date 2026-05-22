"use client"

import { PrinterStatus } from "@/types/printer";
import { useEffect, useState } from "react";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Alert } from "../ui/alert";
import { Spinner } from "../ui/spinner";
import { Button } from "../ui/button";

const PrinterCard = () => {

    const [status, setStatus] = useState<PrinterStatus|null>(null);
    const [error, setError] = useState<null|string>(null);

    const fetchStatus = async () => {
        const res = await fetch('/api/printer-info');
        if(res.ok){
            const status : PrinterStatus = await res.json(); // typed as PrinterStatus
            setStatus(status)
        } else {
            setError((await res.json()).error)
        }
    }

    useEffect(() => {
        fetchStatus();
        console.log
    },[])
    
    return <>
        {error ? 
            <Alert>{error}</Alert> 
            :
            status ? 
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>{status.model}</CardTitle>
                        <CardDescription>Card Description</CardDescription>
                        <CardAction>Card Action</CardAction>
                    </CardHeader>
                    <CardContent>
                        <p>Card Content</p>
                    </CardContent>
                    <CardFooter>
                        <p>Card Footer</p>
                    </CardFooter>
                </Card>
            :
            <Button disabled size="sm">
                <Spinner data-icon="inline-start" />
                Loading...
            </Button>
        }
    
        
    </>
}

export default PrinterCard;