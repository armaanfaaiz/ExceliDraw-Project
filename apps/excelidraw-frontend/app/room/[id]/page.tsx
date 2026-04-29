"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { HTTP_BACKEND } from "../../../config";
import { Canvas } from "@/components/Canvas";
import { WS_URL } from "../../../config";
import { 
    ArrowLeft, 
    Users, 
    Share2, 
    Loader2,
    Wifi,
    WifiOff,
    User,
    ChevronDown,
    Settings,
    LogOut
} from "lucide-react";

export default function Room() {
    const params = useParams();
    const router = useRouter();
    const [room, setRoom] = useState<{id: number; slug: string; adminId: string; createdAt: string} | null>(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [userCount, setUserCount] = useState(1);
    const wsRef = useRef<WebSocket | null>(null);

    const fetchRoom = useCallback(async (roomId: string) => {
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
    }, [router]);

    // Fetch room data once on mount
    useEffect(() => {
        const roomId = params.id;
        if (roomId) {
            fetchRoom(roomId as string);
        }
    }, []);

    // WebSocket connection - create only once
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/signin");
            return;
        }

        // Only create WebSocket if we don't have one
        if (!wsRef.current) {
            const ws = new WebSocket(`${WS_URL}?token=${token}`);
            wsRef.current = ws;
            
            ws.onopen = () => {
                setConnectionStatus('connected');
                setSocket(ws);
            };
            
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'user_count') {
                    setUserCount(message.count);
                }
            };
            
            ws.onerror = () => {
                setConnectionStatus('disconnected');
            };
            
            ws.onclose = () => {
                setConnectionStatus('disconnected');
                wsRef.current = null;
            };

            return () => {
                ws.close();
                wsRef.current = null;
            };
        }
    }, [router]);

    const copyRoomLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setShowShareMenu(false);
        alert("Room link copied to clipboard!");
    };

    if (loading) {
        return (
            <div className="w-screen h-screen bg-slate-900 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
                <p className="text-slate-400">Loading canvas...</p>
            </div>
        );
    }

    if (!socket) {
        return (
            <div className="w-screen h-screen bg-slate-900 flex flex-col items-center justify-center">
                <WifiOff className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-slate-400 mb-4">Failed to connect to server</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-slate-900 relative">
            {/* Top Navigation Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
                <div className="flex items-center justify-between px-4 py-3">
                    {/* Left: Back & Room Info */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.push("/dashboard")}
                            className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="hidden sm:inline">Back</span>
                        </button>
                        
                        {room && (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                        {room.slug.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h1 className="text-white font-semibold">{room.slug}</h1>
                                    <div className="flex items-center gap-2 text-xs">
                                        {connectionStatus === 'connected' ? (
                                            <span className="flex items-center gap-1 text-emerald-400">
                                                <Wifi className="w-3 h-3" />
                                                Live
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-amber-400">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Connecting...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        {/* Connection Status Badge */}
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            connectionStatus === 'connected' 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-amber-500/20 text-amber-400'
                        }`}>
                            {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
                        </div>

                        {/* Share Button */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowShareMenu(!showShareMenu)}
                                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all"
                            >
                                <Share2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Share</span>
                            </button>
                            
                            {showShareMenu && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-4 z-30">
                                    <p className="text-white font-medium mb-2">Share this canvas</p>
                                    <p className="text-slate-400 text-sm mb-3">Anyone with the link can join and collaborate</p>
                                    <button 
                                        onClick={copyRoomLink}
                                        className="w-full py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                                    >
                                        Copy Link
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Users Count */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{userCount}</span>
                        </div>

                        {/* Profile Button */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all border border-slate-700/50"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showProfileMenu && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowProfileMenu(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-xl border border-slate-700 shadow-xl py-2 z-30">
                                        <button className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors">
                                            <Settings className="w-4 h-4" />
                                            <span>Settings</span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                localStorage.removeItem("token");
                                                router.push("/signin");
                                            }}
                                            className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Click outside to close menus */}
            {(showShareMenu || showProfileMenu) && (
                <div 
                    className="fixed inset-0 z-10"
                    onClick={() => {
                        setShowShareMenu(false);
                        setShowProfileMenu(false);
                    }}
                />
            )}

            {/* Canvas */}
            <div className="pt-16 h-full">
                <Canvas roomId={params.id as string} socket={socket} />
            </div>
        </div>
    );
}
