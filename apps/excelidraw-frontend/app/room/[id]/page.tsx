"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { HTTP_BACKEND } from "../../../config";
import { Canvas } from "@/components/Canvas";
import { WS_URL } from "../../../config";

export default function Room() {
    const params = useParams();
    const router = useRouter();
    const [room, setRoom] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/signin");
            return;
        }

        const roomId = params.id;
        if (roomId) {
            fetchRoom(roomId as string);
            // Connect to WebSocket
            const ws = new WebSocket(`${WS_URL}?token=${token}`);
            console.log("Connecting to WebSocket:", `${WS_URL}?token=${token}`);
            
            ws.onopen = () => {
                console.log("WebSocket connected successfully");
            };
            
            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
            };
            
            ws.onclose = () => {
                console.log("WebSocket disconnected");
            };
            
            setSocket(ws);

            return () => {
                ws.close();
            };
        }
    }, [params.id, router]);

    const fetchRoom = async (roomId: string) => {
        try {
            const response = await fetch(`${HTTP_BACKEND}/room/${roomId}`);
            
            if (response.ok) {
                const data = await response.json();
                setRoom(data.room);
            } else {
                alert("Room not found");
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Error fetching room:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !socket) {
        return (
            <div className="w-screen h-screen flex justify-center items-center">
                <div>Loading room...</div>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen">
            <div className="absolute top-4 right-4 z-10">
                <button 
                    onClick={() => router.push("/dashboard")}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-gray-100"
                >
                    Back to Dashboard
                </button>
            </div>
            <Canvas roomId={params.id as string} socket={socket} />
        </div>
    );
}
