"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HTTP_BACKEND } from "../../config";

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [roomId, setRoomId] = useState("");
    const [myRooms, setMyRooms] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/signin");
            return;
        }
        
        setUser({ token });
        fetchMyRooms(token);
    }, [router]);

    const fetchMyRooms = async (token: string) => {
        try {
            const response = await fetch(`${HTTP_BACKEND}/my-rooms`, {
                headers: {
                    "Authorization": token
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMyRooms(data.rooms);
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/signin");
    };

    const createRoom = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${HTTP_BACKEND}/room`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token || ""
                },
                body: JSON.stringify({})
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Room created! Room name: ${data.roomName}`);
                fetchMyRooms(token || "");
                router.push(`/room/${data.roomName}`);
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
                            <button 
                                onClick={createRoom}
                                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 w-full max-w-md"
                            >
                                Create New Canvas
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

                    {/* Saved Canvases Section */}
                    {myRooms.length > 0 && (
                        <div className="mt-12">
                            <h3 className="text-2xl font-bold mb-6 text-gray-800">Your Saved Canvases</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {myRooms.map((room) => (
                                    <div 
                                        key={room.id}
                                        onClick={() => router.push(`/room/${room.slug}`)}
                                        className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold text-lg text-gray-800">{room.slug}</h4>
                                                <p className="text-sm text-gray-500">
                                                    Created: {new Date(room.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
                                                Open
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
