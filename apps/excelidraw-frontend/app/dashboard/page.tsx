"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HTTP_BACKEND } from "../../config";

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [roomName, setRoomName] = useState("");
    const [roomId, setRoomId] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/signin");
            return;
        }
        
        setUser({ token });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/signin");
    };

    const createRoom = async () => {
        if (!roomName.trim()) {
            alert("Please enter a room name");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${HTTP_BACKEND}/room`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token || ""
                },
                body: JSON.stringify({ name: roomName })
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Room created! Room name: ${roomName}`);
                router.push(`/room/${roomName}`);
            } else {
                alert("Failed to create room");
            }
        } catch (error) {
            alert("Error creating room");
        }
    };

    const joinRoom = () => {
        if (!roomId.trim()) {
            alert("Please enter a room ID");
            return;
        }
        router.push(`/room/${roomId}`);
    };

    return (
        <div className="w-screen h-screen flex flex-col">
            <div className="p-4 bg-blue-500 text-white flex justify-between items-center">
                <h1 className="text-2xl font-bold">ExceliDraw Dashboard</h1>
                <button 
                    onClick={handleLogout}
                    className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-gray-100"
                >
                    Logout
                </button>
            </div>
            
            <div className="flex-1 flex justify-center items-center">
                <div className="text-center space-y-8">
                    <h2 className="text-3xl font-bold mb-4">Welcome to ExceliDraw!</h2>
                    <p className="text-gray-600">Your collaborative drawing workspace</p>
                    
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="Room name" 
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                className="w-full max-w-md px-4 py-2 border rounded"
                            />
                            <button 
                                onClick={createRoom}
                                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 w-full max-w-md"
                            >
                                Create New Room
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="Room ID" 
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                className="w-full max-w-md px-4 py-2 border rounded"
                            />
                            <button 
                                onClick={joinRoom}
                                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 w-full max-w-md"
                            >
                                Join Existing Room
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
