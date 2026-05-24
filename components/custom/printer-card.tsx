"use client"

import { PrinterStatus } from "@/types/printer";
import { useEffect, useState } from "react";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Alert } from "../ui/alert";
import { Spinner } from "../ui/spinner";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";

const PrinterCard = ({className: classNames} : {className: string}) => {

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
        const interval = setInterval(() => {
            //console.log('This will be called every 10 seconds');
            fetchStatus();
        }, 5000);
        fetchStatus();
        return () => clearInterval(interval);
    },[])
    
    return <>
        {error ? 
            <Alert>{error}</Alert> 
            :
            status ? 
                <Card className={`w-full ${classNames}`}>
                    <CardHeader>
                        <CardTitle>{status.model}</CardTitle>
                        <CardDescription>{status.firmware}</CardDescription>
                        <CardAction>
                            {
                                status.isReady ? 
                                <Badge variant="default" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Ready</Badge>
                                : <Badge variant="secondary">Not Ready/Sleeping</Badge>
                            }                           
                        </CardAction>
                    </CardHeader>
                    <CardContent className="grid grid-cols-4 gap-4">
                        {...status.ink.map((inkLevel) => <>
                                <div className="flex flex-col justify-center text-center">
                                    <h3 className={`font-medium `}>{inkLevel.color.at(0)?.toUpperCase() + inkLevel.color.slice(1)}: {inkLevel.percentRemaining}%</h3>
                                    <Progress
                                        value={inkLevel.percentRemaining}
                                        className="bg-black/20 rounded-3xl"
                                        indicatorStyle={{ backgroundColor: `color-mix(in srgb, rgb(${inkLevel.rgb.join(',')}) 90%, black)`, }}
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            :
            <div className={`flex justify-center ${classNames}`}>
                <Button disabled size="sm">
                    <Spinner data-icon="inline-start" />
                    Loading...
                </Button>
            </div>
        }
    
        
    </>
}

export default PrinterCard;