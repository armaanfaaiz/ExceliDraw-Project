import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Download, Trash2, Type, Hand } from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool = "circle" | "rect" | "pencil" | "text";

export function Canvas({
    roomId,
    socket
}: {
    socket: WebSocket;
    roomId: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("pencil");
    const [textInput, setTextInput] = useState<{show: boolean, x: number, y: number, value: string}>({show: false, x: 0, y: 0, value: ""});
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            
            // Set up text input callback
            g.onTextInput = (x, y) => {
                setTextInput({show: true, x, y, value: ""});
            };
            
            setGame(g);

            return () => {
                g.destroy();
            }
        }
    }, [canvasRef, roomId, socket]);

    const handleTextSubmit = () => {
        if (textInput.value.trim() && game) {
            game.addText(textInput.x, textInput.y, textInput.value.trim());
        }
        setTextInput({...textInput, show: false, value: ""});
    };

    return <div ref={containerRef} style={{
        height: "100vh",
        width: "100vw",
        overflow: "auto",
        position: "relative",
        background: "#0a0a0a"
    }}>
        <div style={{
            minWidth: "3000px",
            minHeight: "3000px",
            position: "relative"
        }}>
            <canvas 
                ref={canvasRef} 
                width={3000} 
                height={3000}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0
                }}
            />
        </div>
        
        <Topbar 
            setSelectedTool={setSelectedTool} 
            selectedTool={selectedTool}
            onCenter={() => {
                if (containerRef.current) {
                    containerRef.current.scrollTo(1000, 1000);
                }
            }}
        />
        
        {textInput.show && (
            <div 
                className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg p-2 shadow-xl"
                style={{
                    left: textInput.x,
                    top: textInput.y
                }}
            >
                <input
                    type="text"
                    autoFocus
                    value={textInput.value}
                    onChange={(e) => setTextInput({...textInput, value: e.target.value})}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTextSubmit();
                        if (e.key === 'Escape') setTextInput({...textInput, show: false, value: ""});
                    }}
                    placeholder="Type text..."
                    className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 outline-none focus:border-violet-500"
                />
                <div className="flex gap-2 mt-2">
                    <button 
                        onClick={handleTextSubmit}
                        className="px-3 py-1 bg-violet-600 text-white rounded text-sm hover:bg-violet-700"
                    >
                        Add
                    </button>
                    <button 
                        onClick={() => setTextInput({...textInput, show: false, value: ""})}
                        className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )}
        
        <div className="fixed bottom-4 left-4 z-30 text-slate-500 text-sm bg-slate-900/80 px-3 py-2 rounded-lg backdrop-blur">
            Tip: Hold Ctrl+Drag or middle-click to pan • Scroll to navigate
        </div>
    </div>
}

function Topbar({selectedTool, setSelectedTool, onCenter}: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void,
    onCenter: () => void
}) {
    return <div className="fixed top-20 left-4 z-30">
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-2 border border-slate-700/50 shadow-xl">
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <IconButton 
                        onClick={() => setSelectedTool("pencil")}
                        activated={selectedTool === "pencil"}
                        icon={<Pencil />}
                    />
                    <IconButton 
                        onClick={() => setSelectedTool("rect")}
                        activated={selectedTool === "rect"} 
                        icon={<RectangleHorizontalIcon />}
                    />
                    <IconButton 
                        onClick={() => setSelectedTool("circle")}
                        activated={selectedTool === "circle"} 
                        icon={<Circle />}
                    />
                    <IconButton 
                        onClick={() => setSelectedTool("text")}
                        activated={selectedTool === "text"} 
                        icon={<Type />}
                    />
                </div>
                <div className="h-px bg-slate-700 my-1" />
                <div className="flex gap-2">
                    <IconButton 
                        onClick={onCenter}
                        activated={false}
                        icon={<Hand />}
                    />
                    <IconButton 
                        onClick={() => {
                            // Clear canvas functionality
                            if (confirm("Clear all drawings?")) {
                                window.location.reload();
                            }
                        }}
                        activated={false}
                        icon={<Trash2 />}
                    />
                    <IconButton 
                        onClick={() => {
                            // Download canvas functionality
                            const canvas = document.querySelector('canvas');
                            if (canvas) {
                                const link = document.createElement('a');
                                link.download = `canvas-${Date.now()}.png`;
                                link.href = canvas.toDataURL();
                                link.click();
                            }
                        }}
                        activated={false}
                        icon={<Download />}
                    />
                </div>
            </div>
        </div>
    </div>
}