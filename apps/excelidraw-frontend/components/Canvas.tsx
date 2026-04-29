import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Download, Trash2 } from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool = "circle" | "rect" | "pencil";

export function Canvas({
    roomId,
    socket
}: {
    socket: WebSocket;
    roomId: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("pencil")

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            return () => {
                g.destroy();
            }
        }
    }, [canvasRef, roomId, socket]);

    return <div style={{
        height: "100vh",
        overflow: "hidden"
    }}>
        <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight}></canvas>
        <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
    </div>
}

function Topbar({selectedTool, setSelectedTool}: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void
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
                </div>
                <div className="h-px bg-slate-700 my-1" />
                <div className="flex gap-2">
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