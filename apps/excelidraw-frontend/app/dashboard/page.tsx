"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HTTP_BACKEND } from "../../config";
import { 
    Plus, 
    LogOut, 
    FolderOpen, 
    Clock, 
    Trash2, 
    Search,
    Palette,
    Users,
    Sparkles,
    ArrowRight,
    Pencil,
    PenTool,
    User,
    ChevronDown,
    Settings
} from "lucide-react";

export default function Dashboard() {
    const router = useRouter();
    const [, setUser] = useState<{token: string} | null>(null);
    const [roomId, setRoomId] = useState("");
    const [myRooms, setMyRooms] = useState<{id: number; slug: string; adminId: string; createdAt: string}[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showProfileMenu, setShowProfileMenu] = useState(false);

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
        setIsLoading(true);
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
                fetchMyRooms(token || "");
                router.push(`/room/${data.roomName}`);
            } else {
                alert("Failed to create room");
            }
        } catch {
            alert("Error creating room");
        } finally {
            setIsLoading(false);
        }
    };

    const joinRoom = () => {
        if (!roomId.trim()) {
            alert("Please enter a room ID");
            return;
        }
        router.push(`/room/${roomId}`);
    };

    const deleteRoom = async (_roomSlug: string) => {
        // This would need a backend endpoint
        alert("Delete functionality coming soon!");
    };

    const filteredRooms = myRooms.filter(room => 
        room.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
            {/* Decorative Pencil Icons */}
            <div className="absolute top-20 left-10 opacity-10 animate-bounce" style={{ animationDuration: '4s' }}>
                <Pencil className="w-20 h-20 text-violet-400" />
            </div>
            <div className="absolute top-40 right-20 opacity-10 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
                <PenTool className="w-24 h-24 text-fuchsia-400" />
            </div>
            <div className="absolute bottom-40 left-1/4 opacity-10 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '0.5s' }}>
                <Pencil className="w-16 h-16 text-blue-400" />
            </div>
            
            {/* Navbar */}
            <nav className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                                <Palette className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                                ExceliDraw
                            </span>
                        </div>
                        
                        {/* Profile Section */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all duration-200 border border-slate-700/50"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-slate-300 font-medium hidden sm:block">My Account</span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showProfileMenu && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowProfileMenu(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 rounded-xl border border-slate-700 shadow-xl py-2 z-20">
                                        <div className="px-4 py-3 border-b border-slate-700">
                                            <p className="text-white font-medium">Welcome back!</p>
                                            <p className="text-slate-400 text-sm">user@example.com</p>
                                        </div>
                                        <button className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors">
                                            <Settings className="w-4 h-4" />
                                            <span>Settings</span>
                                        </button>
                                        <button 
                                            onClick={handleLogout}
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
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                        Welcome to Your{" "}
                        <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                            Creative Space
                        </span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Create, collaborate, and bring your ideas to life with our intuitive drawing tools
                    </p>
                </div>

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* Create New Canvas */}
                    <div 
                        onClick={createRoom}
                        className="group relative overflow-hidden bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-xl shadow-violet-500/20"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                                <Plus className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Create New Canvas</h3>
                            <p className="text-violet-100 mb-4">Start a fresh drawing with a unique name</p>
                            <div className="flex items-center gap-2 text-white font-medium">
                                <span>Get Started</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Join Room */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Join Room</h3>
                            <p className="text-slate-400 mb-4">Enter a room ID to collaborate</p>
                            <div className="w-full space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Enter room ID..." 
                                        value={roomId}
                                        onChange={(e) => setRoomId(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <button 
                                    onClick={joinRoom}
                                    disabled={!roomId.trim()}
                                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/20"
                                >
                                    Join Room
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Saved Canvases Section */}
                <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <FolderOpen className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Your Canvases</h3>
                                    <p className="text-slate-400 text-sm">{myRooms.length} {myRooms.length === 1 ? 'canvas' : 'canvases'} saved</p>
                                </div>
                            </div>
                            {myRooms.length > 0 && (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search canvases..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all w-full sm:w-64"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {filteredRooms.length > 0 ? (
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredRooms.map((room, index) => (
                                    <div 
                                        key={room.id}
                                        className="group relative bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-violet-500/50 hover:bg-slate-800 transition-all duration-300 cursor-pointer"
                                        onClick={() => router.push(`/room/${room.slug}`)}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg flex items-center justify-center">
                                                <span className="text-xl font-bold text-slate-300">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteRoom(room.slug);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <h4 className="text-lg font-semibold text-white mb-1">{room.slug}</h4>
                                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(room.createdAt).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}</span>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-violet-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span>Open Canvas</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : myRooms.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-10 h-10 text-slate-500" />
                            </div>
                            <h4 className="text-lg font-medium text-white mb-2">No canvases yet</h4>
                            <p className="text-slate-400">Create your first canvas to get started!</p>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <p className="text-slate-400">No canvases match your search</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

