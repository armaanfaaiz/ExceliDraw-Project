"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { IconButton } from "./IconButton";
import { 
    Circle, 
    Pencil, 
    Square, 
    Type, 
    Hand, 
    Trash2, 
    Download, 
    Upload,
    MousePointer2,
    ZoomIn,
    ZoomOut,
    Undo,
    Redo,
    Settings,
    Share2,
    Users,
    Lock,
    Unlock
} from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool = "selection" | "rectangle" | "diamond" | "ellipse" | "arrow" | "line" | "pencil" | "text" | "hand";

interface CanvasProps {
    socket: WebSocket;
    roomId: string;
    userCount?: number;
}

export function Canvas({ socket, roomId, userCount = 1 }: CanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("pencil");
    const [scale, setScale] = useState(1);
    const [showGrid, setShowGrid] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            return () => {
                g.destroy();
            };
        }
    }, [canvasRef, roomId, socket]);

    const handleExport = useCallback(() => {
        if (game) {
            const data = game.exportShapes();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `excelidraw-${roomId}-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
        }
    }, [game, roomId]);

    const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && game) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    game.importShapes(data);
                } catch (err) {
                    alert("Invalid file format");
                }
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    }, [game]);

    const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 3));
    const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.3));

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#121212]">
            {/* Grid Background */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: showGrid 
                        ? `radial-gradient(circle, #333 1px, transparent 1px)` 
                        : 'none',
                    backgroundSize: `${20 * scale}px ${20 * scale}px`,
                    opacity: 0.3
                }}
            />
            
            {/* Canvas Container */}
            <div 
                className="absolute inset-0"
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: '0 0'
                }}
            >
                <canvas 
                    ref={canvasRef} 
                    width={3000} 
                    height={3000}
                    className="absolute top-0 left-0 cursor-crosshair"
                />
            </div>

            {/* Main Toolbar - Left Side */}
            <div className="fixed top-1/2 left-4 -translate-y-1/2 z-40 flex flex-col gap-1 bg-[#1e1e1e] rounded-lg shadow-2xl border border-[#2d2d2d] p-1.5">
                <ToolButton 
                    tool="hand" 
                    current={selectedTool} 
                    setTool={setSelectedTool}
                    icon={<Hand size={18} />}
                    shortcut="H"
                />
                <ToolButton 
                    tool="selection" 
                    current={selectedTool} 
                    setTool={setSelectedTool}
                    icon={<MousePointer2 size={18} />}
                    shortcut="V"
                />
                <div className="h-px bg-[#2d2d2d] my-1" />
                <ToolButton 
                    tool="rectangle" 
                    current={selectedTool} 
                    setTool={setSelectedTool}
                    icon={<Square size={18} />}
                    shortcut="R"
                />
                <ToolButton 
                    tool="ellipse" 
                    current={selectedTool} 
                    setTool={setSelectedTool}
                    icon={<Circle size={18} />}
                    shortcut="E"
                />
                <ToolButton 
                    tool="pencil" 
                    current={selectedTool} 
                    setTool={setSelectedTool}
                    icon={<Pencil size={18} />}
                    shortcut="P"
                />
                <ToolButton 
                    tool="text" 
                    current={selectedTool} 
                    setTool={setSelectedTool}
                    icon={<Type size={18} />}
                    shortcut="T"
                />
            </div>

            {/* Top Bar - Actions */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-[#1e1e1e] rounded-lg shadow-2xl border border-[#2d2d2d] px-3 py-2">
                <div className="flex items-center gap-2 pr-3 border-r border-[#2d2d2d]">
                    <span className="text-[#a0a0a0] text-sm font-medium">ExceliDraw</span>
                    {userCount > 1 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full">
                            <Users size={12} className="text-emerald-400" />
                            <span className="text-xs text-emerald-400">{userCount}</span>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - File Operations */}
                <div className="fixed top-4 right-4 z-40 flex flex-col gap-2">
                    <div className="flex flex-col gap-1 bg-[#1e1e1e] rounded-lg shadow-2xl border border-[#2d2d2d] p-1.5">
                        <ActionButton onClick={handleExport} icon={<Download size={18} />} title="Export" />
                        <label className="cursor-pointer">
                            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                            <div className="p-2 rounded hover:bg-[#2d2d2d] transition-colors">
                                <Upload size={18} className="text-[#a0a0a0]" />
                            </div>
                        </label>
                        <ActionButton 
                            onClick={() => {
                                if (confirm("Clear all drawings?")) {
                                    game?.clearAll();
                                }
                            }} 
                            icon={<Trash2 size={18} />}
                            title="Clear"
                        />
                    </div>
                </div>

                {/* Bottom Status Bar */}
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 text-[#696969] text-xs">
                    <span>Canvas: {roomId}</span>
                    <span>•</span>
                    <span>Tool: {selectedTool}</span>
                    <span>•</span>
                    <span>Press H for hand, P for pencil, R for rectangle, T for text</span>
                </div>
            </div>
        </div>
    );
}

function ToolButton({ 
    tool, 
    current, 
    setTool, 
    icon, 
    shortcut 
}: { 
    tool: Tool; 
    current: Tool; 
    setTool: (t: Tool) => void; 
    icon: React.ReactNode;
    shortcut: string;
}) {
    return (
        <button
            onClick={() => setTool(tool)}
            className={`p-2.5 rounded-md transition-all duration-150 group relative ${
                current === tool 
                    ? 'bg-[#696969] text-white shadow-inner' 
                    : 'text-[#a0a0a0] hover:bg-[#2d2d2d] hover:text-white'
            }`}
            title={`${tool} (${shortcut})`}
        >
            {icon}
            <span className="absolute left-full ml-2 px-2 py-1 bg-[#1e1e1e] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-[#2d2d2d]">
                {shortcut}
            </span>
        </button>
    );
}

function ActionButton({ 
    onClick, 
    icon, 
    title,
    active = false
}: { 
    onClick: () => void; 
    icon: React.ReactNode; 
    title?: string;
    active?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-2 rounded-md transition-colors ${
                active 
                    ? 'bg-[#696969] text-white' 
                    : 'text-[#a0a0a0] hover:bg-[#2d2d2d] hover:text-white'
            }`}
        >
            {icon}
        </button>
    );
}