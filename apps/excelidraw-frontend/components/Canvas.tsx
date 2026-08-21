"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
    Users,
    ArrowRight,
    Minus,
    Eraser,
    Sun,
    Moon,
    ZoomIn,
    ZoomOut,
    Undo2,
    Redo2,
    Copy,
    Sparkles,
    Diamond
} from "lucide-react";
import { Game, Shape, FillStyle, StrokeStyle, FontFamily, Theme } from "@/draw/Game";

export type Tool = "selection" | "rectangle" | "diamond" | "ellipse" | "arrow" | "line" | "pencil" | "text" | "eraser" | "hand";

interface CanvasProps {
    socket: WebSocket;
    roomId: string;
    userCount?: number;
}

const STROKE_COLORS_DARK = ["#ffffff", "#f87171", "#4ade80", "#60a5fa", "#fbbf24", "#c084fc", "#f472b6", "#a3a3a3"];
const STROKE_COLORS_LIGHT = ["#1e1e1e", "#e03131", "#2f9e44", "#1971c2", "#f59f00", "#9c36b5", "#d6336c", "#495057"];

const BG_COLORS_DARK = ["transparent", "#ef444433", "#22c55e33", "#3b82f633", "#eab30833", "#a855f733", "#ec489933", "#73737333"];
const BG_COLORS_LIGHT = ["transparent", "#ffc9c9", "#b2f2bb", "#a5d8ff", "#ffec99", "#eebefa", "#fcc2d7", "#e9ecef"];

export function Canvas({ socket, roomId, userCount = 1 }: CanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("pencil");
    const [theme, setTheme] = useState<Theme>("dark");
    
    // Styling Options
    const [strokeColor, setStrokeColor] = useState<string>("#ffffff");
    const [bgColor, setBgColor] = useState<string>("transparent");
    const [fillStyle, setFillStyle] = useState<FillStyle>("hachure");
    const [strokeWidth, setStrokeWidth] = useState<number>(2);
    const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>("solid");
    const [roughness, setRoughness] = useState<number>(1);
    const [opacity, setOpacity] = useState<number>(100);
    const [fontSize, setFontSize] = useState<number>(24);
    const [fontFamily, setFontFamily] = useState<FontFamily>("Caveat");
    
    // Zoom and Selection
    const [zoom, setZoom] = useState<number>(1);
    const [selectedShape, setSelectedShape] = useState<Shape | null>(null);

    // Inline Text Editor state
    const [textInput, setTextInput] = useState<{ x: number; y: number; content: string; shapeId?: string } | null>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            
            g.onTextInputRequested = (x, y, initialContent, shapeId) => {
                setTextInput({ x, y, content: initialContent, shapeId });
            };

            g.onSelectionChange = (shape) => {
                setSelectedShape(shape);
                if (shape) {
                    if (shape.stroke) setStrokeColor(shape.stroke);
                    if (shape.bg) setBgColor(shape.bg);
                    if (shape.fillStyle) setFillStyle(shape.fillStyle);
                    if (shape.strokeWidth) setStrokeWidth(shape.strokeWidth);
                    if (shape.strokeStyle) setStrokeStyle(shape.strokeStyle);
                    if (shape.roughness !== undefined) setRoughness(shape.roughness);
                    if (shape.opacity !== undefined) setOpacity(shape.opacity);
                    if (shape.type === "text") {
                        if (shape.fontSize) setFontSize(shape.fontSize);
                        if (shape.fontFamily) setFontFamily(shape.fontFamily);
                    }
                }
            };

            g.onZoomChange = (z) => setZoom(z);

            setGame(g);

            return () => {
                g.destroy();
            };
        }
    }, [canvasRef, roomId, socket]);

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {
        game?.setTheme(theme);
        setStrokeColor(theme === "dark" ? "#ffffff" : "#1e1e1e");
    }, [theme, game]);

    useEffect(() => {
        game?.setOptions({
            stroke: strokeColor,
            bg: bgColor,
            fillStyle,
            strokeWidth,
            strokeStyle,
            roughness,
            opacity,
            fontSize,
            fontFamily
        });
    }, [strokeColor, bgColor, fillStyle, strokeWidth, strokeStyle, roughness, opacity, fontSize, fontFamily, game]);

    // Focus text editor when visible
    useEffect(() => {
        if (textInput && textInputRef.current) {
            textInputRef.current.focus();
        }
    }, [textInput]);

    // Keyboard Shortcuts (1-9)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
                return;
            }
            const key = e.key.toLowerCase();
            if (key === "1" || key === "h") setSelectedTool("hand");
            if (key === "2" || key === "v") setSelectedTool("selection");
            if (key === "3" || key === "r") setSelectedTool("rectangle");
            if (key === "4" || key === "d") setSelectedTool("diamond");
            if (key === "5" || key === "e") setSelectedTool("ellipse");
            if (key === "6" || key === "a") setSelectedTool("arrow");
            if (key === "7" || key === "l") setSelectedTool("line");
            if (key === "8" || key === "p") setSelectedTool("pencil");
            if (key === "9" || key === "t") setSelectedTool("text");
            if (key === "0" || key === "x") setSelectedTool("eraser");
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleTextSubmit = () => {
        if (textInput && game) {
            game.addText(textInput.x, textInput.y, textInput.content, textInput.shapeId);
        }
        setTextInput(null);
    };

    const handleExportJSON = useCallback(() => {
        if (game) {
            const data = game.exportShapes();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `excelidraw-${roomId}-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
        }
    }, [game, roomId]);

    const handleImportJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && game) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    game.importShapes(data);
                } catch {
                    alert("Invalid JSON format");
                }
            };
            reader.readAsText(file);
        }
        e.target.value = "";
    }, [game]);

    const strokeSwatches = theme === "dark" ? STROKE_COLORS_DARK : STROKE_COLORS_LIGHT;
    const bgSwatches = theme === "dark" ? BG_COLORS_DARK : BG_COLORS_LIGHT;
    const isDark = theme === "dark";

    return (
        <div className={`relative w-screen h-screen overflow-hidden select-none font-sans ${isDark ? "bg-[#121212] text-white" : "bg-[#f8f9fa] text-slate-800"}`}>
            
            {/* HTML Canvas */}
            <div className="absolute inset-0 w-full h-full">
                <canvas 
                    ref={canvasRef} 
                    className={`w-full h-full ${selectedTool === "hand" ? "cursor-grab" : selectedTool === "text" ? "cursor-text" : "cursor-crosshair"}`}
                />
            </div>

            {/* Inline Text Area Overlay */}
            {textInput && (
                <div 
                    className="absolute z-50 transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: textInput.x, top: textInput.y }}
                >
                    <textarea
                        ref={textInputRef}
                        value={textInput.content}
                        onChange={(e) => setTextInput({ ...textInput, content: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) {
                                e.preventDefault();
                                handleTextSubmit();
                            } else if (e.key === "Escape") {
                                setTextInput(null);
                            }
                        }}
                        onBlur={handleTextSubmit}
                        className={`bg-transparent outline-none border-2 border-dashed border-[#6965db] p-1.5 resize-none overflow-hidden ${
                            fontFamily === "Caveat" ? "font-caveat" : fontFamily === "monospace" ? "font-mono" : "font-sans"
                        }`}
                        style={{
                            color: strokeColor,
                            fontSize: `${fontSize * zoom}px`,
                            lineHeight: 1.2,
                            minWidth: "120px",
                            minHeight: `${fontSize * 1.4 * zoom}px`
                        }}
                        rows={textInput.content.split("\n").length || 1}
                    />
                </div>
            )}

            {/* Header Top Bar */}
            <div className="fixed top-3 left-4 z-40 flex items-center gap-3">
                <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border shadow-lg backdrop-blur-md transition-colors ${
                    isDark ? "bg-[#1e1e1e]/90 border-[#2d2d2d]" : "bg-white/90 border-slate-200"
                }`}>
                    <div className="flex items-center gap-2 font-bold text-base tracking-tight text-indigo-500">
                        <Sparkles size={20} className="animate-pulse" />
                        <span>ExceliDraw</span>
                    </div>
                    <div className={`h-4 w-px ${isDark ? "bg-[#2d2d2d]" : "bg-slate-200"}`} />
                    <span className="text-xs font-medium text-gray-400">Canvas #{roomId}</span>
                    {userCount > 1 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <Users size={12} className="text-emerald-500 animate-pulse" />
                            <span className="text-xs font-semibold text-emerald-500">{userCount} live</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Header Right Actions */}
            <div className="fixed top-3 right-4 z-40 flex items-center gap-2">
                <div className={`flex items-center gap-1 p-1 rounded-xl border shadow-lg backdrop-blur-md ${
                    isDark ? "bg-[#1e1e1e]/90 border-[#2d2d2d]" : "bg-white/90 border-slate-200"
                }`}>
                    {/* Theme Switcher */}
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className={`p-2 rounded-lg transition-all ${
                            isDark ? "hover:bg-[#2d2d2d] text-amber-400" : "hover:bg-slate-100 text-indigo-600"
                        }`}
                        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
                    >
                        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <div className={`h-4 w-px ${isDark ? "bg-[#2d2d2d]" : "bg-slate-200"}`} />

                    {/* Export */}
                    <button
                        onClick={handleExportJSON}
                        className={`p-2 rounded-lg transition-all ${isDark ? "hover:bg-[#2d2d2d] text-gray-300" : "hover:bg-slate-100 text-slate-600"}`}
                        title="Export JSON Canvas"
                    >
                        <Download size={18} />
                    </button>

                    {/* Import */}
                    <label className={`p-2 rounded-lg cursor-pointer transition-all ${isDark ? "hover:bg-[#2d2d2d] text-gray-300" : "hover:bg-slate-100 text-slate-600"}`}>
                        <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                        <Upload size={18} />
                    </label>

                    <div className={`h-4 w-px ${isDark ? "bg-[#2d2d2d]" : "bg-slate-200"}`} />

                    {/* Clear All */}
                    <button
                        onClick={() => {
                            if (confirm("Are you sure you want to clear the canvas?")) {
                                game?.clearAll();
                            }
                        }}
                        className={`p-2 rounded-lg transition-all text-red-500 ${isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"}`}
                        title="Clear Canvas"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Main Floating Tool Dock (Top Center) */}
            <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40">
                <div className={`flex items-center gap-1 p-1.5 rounded-2xl border shadow-xl backdrop-blur-lg ${
                    isDark ? "bg-[#1e1e1e]/90 border-[#2d2d2d]" : "bg-white/90 border-slate-200"
                }`}>
                    <ToolButton tool="hand" current={selectedTool} setTool={setSelectedTool} icon={<Hand size={18} />} shortcut="1" label="Hand (Pan)" isDark={isDark} />
                    <ToolButton tool="selection" current={selectedTool} setTool={setSelectedTool} icon={<MousePointer2 size={18} />} shortcut="2" label="Selection" isDark={isDark} />
                    <div className={`h-5 w-px my-auto ${isDark ? "bg-[#2d2d2d]" : "bg-slate-200"}`} />
                    <ToolButton tool="rectangle" current={selectedTool} setTool={setSelectedTool} icon={<Square size={18} />} shortcut="3" label="Rectangle" isDark={isDark} />
                    <ToolButton tool="diamond" current={selectedTool} setTool={setSelectedTool} icon={<Diamond size={18} />} shortcut="4" label="Diamond" isDark={isDark} />
                    <ToolButton tool="ellipse" current={selectedTool} setTool={setSelectedTool} icon={<Circle size={18} />} shortcut="5" label="Ellipse" isDark={isDark} />
                    <ToolButton tool="arrow" current={selectedTool} setTool={setSelectedTool} icon={<ArrowRight size={18} />} shortcut="6" label="Arrow" isDark={isDark} />
                    <ToolButton tool="line" current={selectedTool} setTool={setSelectedTool} icon={<Minus size={18} />} shortcut="7" label="Line" isDark={isDark} />
                    <ToolButton tool="pencil" current={selectedTool} setTool={setSelectedTool} icon={<Pencil size={18} />} shortcut="8" label="Draw (Pencil)" isDark={isDark} />
                    <ToolButton tool="text" current={selectedTool} setTool={setSelectedTool} icon={<Type size={18} />} shortcut="9" label="Text" isDark={isDark} />
                    <div className={`h-5 w-px my-auto ${isDark ? "bg-[#2d2d2d]" : "bg-slate-200"}`} />
                    <ToolButton tool="eraser" current={selectedTool} setTool={setSelectedTool} icon={<Eraser size={18} />} shortcut="0" label="Eraser" isDark={isDark} />
                </div>
            </div>

            {/* Left Property Sidebar Panel */}
            <div className="fixed top-20 left-4 z-30 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
                <div className={`w-56 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md flex flex-col gap-4 text-xs transition-colors ${
                    isDark ? "bg-[#1e1e1e]/90 border-[#2d2d2d]" : "bg-white/90 border-slate-200"
                }`}>
                    {/* Stroke Color */}
                    <div>
                        <span className={`block font-semibold mb-2 ${isDark ? "text-gray-300" : "text-slate-600"}`}>Stroke Color</span>
                        <div className="flex flex-wrap gap-1.5">
                            {strokeSwatches.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setStrokeColor(color)}
                                    className={`w-6 h-6 rounded-md border transition-transform ${
                                        strokeColor === color ? "scale-110 ring-2 ring-indigo-500 border-white" : "hover:scale-105 border-transparent"
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Background Fill Color */}
                    <div>
                        <span className={`block font-semibold mb-2 ${isDark ? "text-gray-300" : "text-slate-600"}`}>Background Fill</span>
                        <div className="flex flex-wrap gap-1.5">
                            {bgSwatches.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setBgColor(color)}
                                    className={`w-6 h-6 rounded-md border relative transition-transform ${
                                        bgColor === color ? "scale-110 ring-2 ring-indigo-500 border-white" : "hover:scale-105 border-transparent"
                                    }`}
                                    style={{ backgroundColor: color === "transparent" ? "transparent" : color }}
                                >
                                    {color === "transparent" && (
                                        <div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs font-bold">/</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fill Style */}
                    <div>
                        <span className={`block font-semibold mb-2 ${isDark ? "text-gray-300" : "text-slate-600"}`}>Fill Style</span>
                        <div className="grid grid-cols-3 gap-1">
                            {(["hachure", "cross-hatch", "solid"] as FillStyle[]).map((style) => (
                                <button
                                    key={style}
                                    onClick={() => setFillStyle(style)}
                                    className={`py-1.5 px-2 rounded-lg font-medium capitalize border transition-all ${
                                        fillStyle === style 
                                            ? "bg-indigo-600 text-white border-indigo-600" 
                                            : isDark ? "bg-[#2a2a2a] text-gray-300 border-[#333]" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                    }`}
                                >
                                    {style.replace("-", " ")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stroke Width */}
                    <div>
                        <span className={`block font-semibold mb-2 ${isDark ? "text-gray-300" : "text-slate-600"}`}>Stroke Width</span>
                        <div className="grid grid-cols-3 gap-1">
                            {[
                                { width: 1, label: "Thin" },
                                { width: 2, label: "Medium" },
                                { width: 4, label: "Thick" }
                            ].map((w) => (
                                <button
                                    key={w.width}
                                    onClick={() => setStrokeWidth(w.width)}
                                    className={`py-1.5 px-2 rounded-lg font-medium border transition-all ${
                                        strokeWidth === w.width 
                                            ? "bg-indigo-600 text-white border-indigo-600" 
                                            : isDark ? "bg-[#2a2a2a] text-gray-300 border-[#333]" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                    }`}
                                >
                                    {w.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stroke Style */}
                    <div>
                        <span className={`block font-semibold mb-2 ${isDark ? "text-gray-300" : "text-slate-600"}`}>Stroke Style</span>
                        <div className="grid grid-cols-3 gap-1">
                            {(["solid", "dashed", "dotted"] as StrokeStyle[]).map((style) => (
                                <button
                                    key={style}
                                    onClick={() => setStrokeStyle(style)}
                                    className={`py-1.5 px-2 rounded-lg font-medium capitalize border transition-all ${
                                        strokeStyle === style 
                                            ? "bg-indigo-600 text-white border-indigo-600" 
                                            : isDark ? "bg-[#2a2a2a] text-gray-300 border-[#333]" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                    }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sloppiness / Roughness */}
                    <div>
                        <span className={`block font-semibold mb-2 ${isDark ? "text-gray-300" : "text-slate-600"}`}>Sloppiness</span>
                        <div className="grid grid-cols-3 gap-1">
                            {[
                                { val: 0, label: "Clean" },
                                { val: 1, label: "Artist" },
                                { val: 2, label: "Cartoon" }
                            ].map((r) => (
                                <button
                                    key={r.val}
                                    onClick={() => setRoughness(r.val)}
                                    className={`py-1.5 px-2 rounded-lg font-medium border transition-all ${
                                        roughness === r.val 
                                            ? "bg-indigo-600 text-white border-indigo-600" 
                                            : isDark ? "bg-[#2a2a2a] text-gray-300 border-[#333]" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Family & Size (if Text tool or selected shape is text) */}
                    {(selectedTool === "text" || selectedShape?.type === "text") && (
                        <>
                            <div>
                                <span className={`block font-semibold mb-2 ${isDark ? "text-gray-300" : "text-slate-600"}`}>Font Family</span>
                                <div className="grid grid-cols-3 gap-1">
                                    {[
                                        { fam: "Caveat" as FontFamily, label: "Hand" },
                                        { fam: "sans-serif" as FontFamily, label: "Normal" },
                                        { fam: "monospace" as FontFamily, label: "Code" }
                                    ].map((f) => (
                                        <button
                                            key={f.fam}
                                            onClick={() => setFontFamily(f.fam)}
                                            className={`py-1.5 px-2 rounded-lg font-medium border transition-all ${
                                                fontFamily === f.fam 
                                                    ? "bg-indigo-600 text-white border-indigo-600" 
                                                    : isDark ? "bg-[#2a2a2a] text-gray-300 border-[#333]" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className={`block font-semibold mb-2 ${isDark ? "text-gray-300" : "text-slate-600"}`}>Font Size</span>
                                <div className="grid grid-cols-4 gap-1">
                                    {[
                                        { size: 16, label: "S" },
                                        { size: 24, label: "M" },
                                        { size: 32, label: "L" },
                                        { size: 48, label: "XL" }
                                    ].map((s) => (
                                        <button
                                            key={s.size}
                                            onClick={() => setFontSize(s.size)}
                                            className={`py-1 px-2 rounded-lg font-semibold border transition-all ${
                                                fontSize === s.size 
                                                    ? "bg-indigo-600 text-white border-indigo-600" 
                                                    : isDark ? "bg-[#2a2a2a] text-gray-300 border-[#333]" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                            }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Actions on Selected Shape */}
                    {selectedShape && (
                        <div className="pt-2 border-t border-gray-700/50 flex flex-col gap-2">
                            <span className={`block font-semibold ${isDark ? "text-gray-300" : "text-slate-600"}`}>Actions</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => game?.duplicateSelectedShape()}
                                    className={`flex-1 py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 border transition-all ${
                                        isDark ? "bg-[#2a2a2a] hover:bg-[#333] border-[#333]" : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                                    }`}
                                >
                                    <Copy size={14} />
                                    Duplicate
                                </button>
                                <button
                                    onClick={() => game?.deleteSelectedShape()}
                                    className="py-1.5 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Right Floating Zoom & History Controls */}
            <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
                {/* Undo / Redo */}
                <div className={`flex items-center gap-1 p-1.5 rounded-xl border shadow-lg backdrop-blur-md ${
                    isDark ? "bg-[#1e1e1e]/90 border-[#2d2d2d]" : "bg-white/90 border-slate-200"
                }`}>
                    <button
                        onClick={() => game?.undo()}
                        className={`p-2 rounded-lg transition-all ${isDark ? "hover:bg-[#2d2d2d] text-gray-300" : "hover:bg-slate-100 text-slate-600"}`}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 size={16} />
                    </button>
                    <button
                        onClick={() => game?.redo()}
                        className={`p-2 rounded-lg transition-all ${isDark ? "hover:bg-[#2d2d2d] text-gray-300" : "hover:bg-slate-100 text-slate-600"}`}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo2 size={16} />
                    </button>
                </div>

                {/* Zoom Controls */}
                <div className={`flex items-center gap-1.5 p-1.5 rounded-xl border shadow-lg backdrop-blur-md ${
                    isDark ? "bg-[#1e1e1e]/90 border-[#2d2d2d]" : "bg-white/90 border-slate-200"
                }`}>
                    <button
                        onClick={() => game?.setZoom(zoom * 0.9)}
                        className={`p-1.5 rounded-lg transition-all ${isDark ? "hover:bg-[#2d2d2d] text-gray-300" : "hover:bg-slate-100 text-slate-600"}`}
                        title="Zoom Out"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <button
                        onClick={() => game?.resetZoom()}
                        className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                            isDark ? "hover:bg-[#2d2d2d] text-gray-300" : "hover:bg-slate-100 text-slate-600"
                        }`}
                        title="Reset Zoom"
                    >
                        {Math.round(zoom * 100)}%
                    </button>
                    <button
                        onClick={() => game?.setZoom(zoom * 1.1)}
                        className={`p-1.5 rounded-lg transition-all ${isDark ? "hover:bg-[#2d2d2d] text-gray-300" : "hover:bg-slate-100 text-slate-600"}`}
                        title="Zoom In"
                    >
                        <ZoomIn size={16} />
                    </button>
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
    shortcut,
    label,
    isDark
}: { 
    tool: Tool; 
    current: Tool; 
    setTool: (t: Tool) => void; 
    icon: React.ReactNode;
    shortcut: string;
    label: string;
    isDark: boolean;
}) {
    const active = current === tool;
    return (
        <button
            onClick={() => setTool(tool)}
            className={`p-2.5 rounded-xl transition-all relative group ${
                active 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105" 
                    : isDark 
                    ? "text-gray-400 hover:bg-[#2d2d2d] hover:text-white" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
            title={`${label} (${shortcut})`}
        >
            {icon}
            {/* Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg transition-opacity border border-gray-800 z-50">
                {label} ({shortcut})
            </div>
        </button>
    );
}