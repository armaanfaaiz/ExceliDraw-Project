import rough from "roughjs";
import { RoughCanvas } from "roughjs/bin/canvas";
import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

export type FillStyle = "hachure" | "solid" | "cross-hatch" | "dots" | "zigzag";
export type StrokeStyle = "solid" | "dashed" | "dotted";
export type FontFamily = "Caveat" | "sans-serif" | "monospace";
export type Theme = "dark" | "light";

export type CommonShapeProps = {
    id: string;
    stroke?: string;
    bg?: string;
    fillStyle?: FillStyle;
    strokeWidth?: number;
    strokeStyle?: StrokeStyle;
    roughness?: number;
    opacity?: number;
    angle?: number;
};

export type RectShape = CommonShapeProps & {
    type: "rect" | "rectangle";
    x: number;
    y: number;
    width: number;
    height: number;
};

export type DiamondShape = CommonShapeProps & {
    type: "diamond";
    x: number;
    y: number;
    width: number;
    height: number;
};

export type EllipseShape = CommonShapeProps & {
    type: "circle" | "ellipse";
    centerX: number;
    centerY: number;
    radius: number;
    radiusX?: number;
    radiusY?: number;
};

export type ArrowShape = CommonShapeProps & {
    type: "arrow";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
};

export type LineShape = CommonShapeProps & {
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
};

export type PencilShape = CommonShapeProps & {
    type: "pencil";
    points: { x: number; y: number }[];
};

export type TextShape = CommonShapeProps & {
    type: "text";
    x: number;
    y: number;
    content: string;
    fontSize: number;
    fontFamily?: FontFamily;
};

export type Shape = RectShape | DiamondShape | EllipseShape | ArrowShape | LineShape | PencilShape | TextShape;

export type ShapeOptions = {
    stroke: string;
    bg: string;
    fillStyle: FillStyle;
    strokeWidth: number;
    strokeStyle: StrokeStyle;
    roughness: number;
    opacity: number;
    fontSize: number;
    fontFamily: FontFamily;
};

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | "rotate" | null;

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private rc: RoughCanvas;
    private existingShapes: Shape[] = [];
    private roomId: string;
    private socket: WebSocket;

    // Active tool and properties
    private selectedTool: Tool = "selection";
    private theme: Theme = "dark";
    private options: ShapeOptions = {
        stroke: "#ffffff",
        bg: "transparent",
        fillStyle: "hachure",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        fontSize: 24,
        fontFamily: "Caveat"
    };

    // Drawing & interaction state
    private clicked = false;
    private startX = 0;
    private startY = 0;
    private currentPencilPoints: { x: number; y: number }[] = [];
    
    // Selection and manipulation state
    private selectedShapeId: string | null = null;
    private isDraggingShape = false;
    private isResizingShape = false;
    private activeHandle: ResizeHandle = null;
    private dragOffsetX = 0;
    private dragOffsetY = 0;
    private initialShapeState: Shape | null = null;

    // Pan and zoom
    private offsetX = 0;
    private offsetY = 0;
    private zoom = 1;
    private isPanning = false;
    private lastPanX = 0;
    private lastPanY = 0;

    // History (Undo / Redo)
    private undoStack: Shape[][] = [];
    private redoStack: Shape[][] = [];

    // Callbacks
    public onTextInputRequested: ((x: number, y: number, initialContent: string, shapeId?: string) => void) | null = null;
    public onSelectionChange: ((selectedShape: Shape | null) => void) | null = null;
    public onZoomChange: ((zoom: number) => void) | null = null;
    
    private messageHandler: ((event: MessageEvent) => void) | null = null;
    private resizeObserver: ResizeObserver | null = null;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.rc = rough.canvas(canvas);
        this.roomId = roomId;
        this.socket = socket;

        this.setupCanvasDimensions();
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
        this.initKeyHandlers();
    }

    private setupCanvasDimensions() {
        const parent = this.canvas.parentElement;
        if (!parent) return;

        const dpr = window.devicePixelRatio || 1;
        const width = parent.clientWidth || window.innerWidth;
        const height = parent.clientHeight || window.innerHeight;

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.ctx.scale(dpr, dpr);

        this.resizeObserver = new ResizeObserver(() => {
            if (!this.canvas.parentElement) return;
            const w = this.canvas.parentElement.clientWidth;
            const h = this.canvas.parentElement.clientHeight;
            this.canvas.width = w * dpr;
            this.canvas.height = h * dpr;
            this.canvas.style.width = `${w}px`;
            this.canvas.style.height = `${h}px`;
            this.clearCanvas();
        });
        this.resizeObserver.observe(parent);
    }

    public destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.removeEventListener("dblclick", this.doubleClickHandler);
        this.canvas.removeEventListener("wheel", this.wheelHandler);
        window.removeEventListener("keydown", this.keyDownHandler);


        if (this.messageHandler) {
            this.socket.removeEventListener("message", this.messageHandler);
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    // Set active tool
    public setTool(tool: Tool) {
        this.selectedTool = tool;
        if (tool !== "selection") {
            this.selectedShapeId = null;
            if (this.onSelectionChange) this.onSelectionChange(null);
        }
        this.clearCanvas();
    }

    // Set Theme
    public setTheme(theme: Theme) {
        this.theme = theme;
        // Update default stroke color if appropriate
        if (theme === "dark" && (this.options.stroke === "#1e1e1e" || this.options.stroke === "#000000")) {
            this.options.stroke = "#ffffff";
        } else if (theme === "light" && (this.options.stroke === "#ffffff" || this.options.stroke === "#ffffff")) {
            this.options.stroke = "#1e1e1e";
        }
        this.clearCanvas();
    }

    public getTheme(): Theme {
        return this.theme;
    }

    // Options management
    public setOptions(newOptions: Partial<ShapeOptions>) {
        this.options = { ...this.options, ...newOptions };
        
        // If a shape is selected, apply styling to selected shape
        if (this.selectedShapeId) {
            const shapeIndex = this.existingShapes.findIndex(s => s.id === this.selectedShapeId);
            if (shapeIndex !== -1) {
                this.saveHistory();
                const shape = { ...this.existingShapes[shapeIndex] };
                if (newOptions.stroke !== undefined) shape.stroke = newOptions.stroke;
                if (newOptions.bg !== undefined) shape.bg = newOptions.bg;
                if (newOptions.fillStyle !== undefined) shape.fillStyle = newOptions.fillStyle;
                if (newOptions.strokeWidth !== undefined) shape.strokeWidth = newOptions.strokeWidth;
                if (newOptions.strokeStyle !== undefined) shape.strokeStyle = newOptions.strokeStyle;
                if (newOptions.roughness !== undefined) shape.roughness = newOptions.roughness;
                if (newOptions.opacity !== undefined) shape.opacity = newOptions.opacity;
                if (newOptions.fontSize !== undefined && shape.type === "text") shape.fontSize = newOptions.fontSize;
                if (newOptions.fontFamily !== undefined && shape.type === "text") shape.fontFamily = newOptions.fontFamily;

                this.existingShapes[shapeIndex] = shape;
                this.broadcastShape(shape, "update");
                if (this.onSelectionChange) this.onSelectionChange(shape);
                this.clearCanvas();
            }
        }
    }

    public getOptions(): ShapeOptions {
        return this.options;
    }

    public getZoom(): number {
        return this.zoom;
    }

    public setZoom(zoom: number) {
        this.zoom = Math.max(0.1, Math.min(5, zoom));
        if (this.onZoomChange) this.onZoomChange(this.zoom);
        this.clearCanvas();
    }

    public resetZoom() {
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        if (this.onZoomChange) this.onZoomChange(1);
        this.clearCanvas();
    }

    async init() {
        const loadedShapes = await getExistingShapes(this.roomId);
        // Normalize shapes with IDs and defaults
        this.existingShapes = loadedShapes.map((s: any) => this.normalizeShape(s));
        this.clearCanvas();
    }

    private normalizeShape(s: any): Shape {
        const id = s.id || Math.random().toString(36).substring(2, 9);
        const stroke = s.stroke || (this.theme === "dark" ? "#ffffff" : "#1e1e1e");
        const bg = s.bg || "transparent";
        const fillStyle = s.fillStyle || "hachure";
        const strokeWidth = s.strokeWidth || 2;
        const strokeStyle = s.strokeStyle || "solid";
        const roughness = s.roughness ?? 1;
        const opacity = s.opacity ?? 100;

        return {
            ...s,
            id,
            stroke,
            bg,
            fillStyle,
            strokeWidth,
            strokeStyle,
            roughness,
            opacity
        };
    }

    private sendJoinRoom() {
        this.socket.send(JSON.stringify({
            type: "join_room",
            roomId: this.roomId
        }));
    }

    initHandlers() {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.sendJoinRoom();
        } else {
            this.socket.onopen = () => this.sendJoinRoom();
        }

        this.messageHandler = (event: MessageEvent) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === "chat") {
                    const parsedData = JSON.parse(message.message);
                    if (parsedData.action === "delete" && parsedData.id) {
                        this.existingShapes = this.existingShapes.filter(s => s.id !== parsedData.id);
                        if (this.selectedShapeId === parsedData.id) {
                            this.selectedShapeId = null;
                            if (this.onSelectionChange) this.onSelectionChange(null);
                        }
                        this.clearCanvas();
                    } else if (parsedData.action === "clear") {
                        this.existingShapes = [];
                        this.selectedShapeId = null;
                        if (this.onSelectionChange) this.onSelectionChange(null);
                        this.clearCanvas();
                    } else if (parsedData.shape) {
                        const normalized = this.normalizeShape(parsedData.shape);
                        const existingIdx = this.existingShapes.findIndex(s => s.id === normalized.id);
                        if (existingIdx !== -1) {
                            this.existingShapes[existingIdx] = normalized;
                        } else {
                            this.existingShapes.push(normalized);
                        }
                        this.clearCanvas();
                    }
                }
            } catch (e) {
                console.error("Error parsing WS message:", e);
            }
        };
        this.socket.addEventListener("message", this.messageHandler);
    }

    // Save history for undo/redo
    private saveHistory() {
        this.undoStack.push(JSON.parse(JSON.stringify(this.existingShapes)));
        if (this.undoStack.length > 50) this.undoStack.shift();
        this.redoStack = [];
    }

    public undo() {
        if (this.undoStack.length === 0) return;
        this.redoStack.push(JSON.parse(JSON.stringify(this.existingShapes)));
        this.existingShapes = this.undoStack.pop() || [];
        this.selectedShapeId = null;
        if (this.onSelectionChange) this.onSelectionChange(null);
        this.clearCanvas();
    }

    public redo() {
        if (this.redoStack.length === 0) return;
        this.undoStack.push(JSON.parse(JSON.stringify(this.existingShapes)));
        this.existingShapes = this.redoStack.pop() || [];
        this.selectedShapeId = null;
        if (this.onSelectionChange) this.onSelectionChange(null);
        this.clearCanvas();
    }

    // Convert Screen Space coordinates to Canvas World coordinates
    private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = screenX - rect.left;
        const clientY = screenY - rect.top;
        const x = (clientX - this.offsetX) / this.zoom;
        const y = (clientY - this.offsetY) / this.zoom;
        return { x, y };
    }

    // Convert Canvas World coordinates to Screen Space coordinates
    public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = worldX * this.zoom + this.offsetX + rect.left;
        const screenY = worldY * this.zoom + this.offsetY + rect.top;
        return { x: screenX, y: screenY };
    }


    // Clear and redraw entire canvas
    public clearCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const width = this.canvas.width / dpr;
        const height = this.canvas.height / dpr;

        this.ctx.save();
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Fill canvas background
        this.ctx.fillStyle = this.theme === "dark" ? "#121212" : "#f8f9fa";
        this.ctx.fillRect(0, 0, width, height);

        // Draw dot grid
        this.drawGrid(width, height);

        // Apply Pan & Zoom Transformation
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.zoom, this.zoom);

        // Draw all existing shapes
        this.existingShapes.forEach((shape) => {
            this.drawShape(shape);
        });

        // Draw active selection bounding box & handles
        if (this.selectedShapeId) {
            const selectedShape = this.existingShapes.find(s => s.id === this.selectedShapeId);
            if (selectedShape) {
                this.drawSelectionBox(selectedShape);
            }
        }

        this.ctx.restore();
    }

    private drawGrid(width: number, height: number) {
        const gridSize = 20 * this.zoom;
        const dotColor = this.theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
        
        const startX = (this.offsetX % gridSize + gridSize) % gridSize;
        const startY = (this.offsetY % gridSize + gridSize) % gridSize;

        this.ctx.fillStyle = dotColor;
        for (let x = startX; x < width; x += gridSize) {
            for (let y = startY; y < height; y += gridSize) {
                this.ctx.fillRect(x, y, 1.5, 1.5);
            }
        }
    }

    // Helper: Draw shape with Rough.js
    private drawShape(shape: Shape, isPreview = false) {
        const strokeColor = shape.stroke || (this.theme === "dark" ? "#ffffff" : "#1e1e1e");
        const bgColor = shape.bg && shape.bg !== "transparent" ? shape.bg : undefined;
        const fillStyle = shape.fillStyle || "hachure";
        const strokeWidth = shape.strokeWidth || 2;
        const roughness = shape.roughness ?? 1;
        const opacity = (shape.opacity ?? 100) / 100;

        const options: any = {
            stroke: strokeColor,
            fill: bgColor,
            fillStyle: fillStyle,
            strokeWidth: strokeWidth,
            roughness: roughness,
            bowing: 1,
            strokeLineDash: shape.strokeStyle === "dashed" ? [8, 8] : shape.strokeStyle === "dotted" ? [3, 3] : undefined,
        };

        this.ctx.save();
        this.ctx.globalAlpha = opacity;

        if (shape.type === "rect" || shape.type === "rectangle") {
            this.rc.rectangle(shape.x, shape.y, shape.width, shape.height, options);
        } else if (shape.type === "diamond") {
            const hw = shape.width / 2;
            const hh = shape.height / 2;
            const cx = shape.x + hw;
            const cy = shape.y + hh;
            const points: [number, number][] = [
                [cx, shape.y],
                [shape.x + shape.width, cy],
                [cx, shape.y + shape.height],
                [shape.x, cy]
            ];
            this.rc.polygon(points, options);
        } else if (shape.type === "circle" || shape.type === "ellipse") {
            const rx = shape.radiusX || shape.radius;
            const ry = shape.radiusY || shape.radius;
            this.rc.ellipse(shape.centerX, shape.centerY, Math.abs(rx) * 2, Math.abs(ry) * 2, options);
        } else if (shape.type === "line") {
            this.rc.line(shape.startX, shape.startY, shape.endX, shape.endY, options);
        } else if (shape.type === "arrow") {
            // Draw main line
            this.rc.line(shape.startX, shape.startY, shape.endX, shape.endY, options);
            // Draw arrowhead
            const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
            const headLength = 15;
            const arrowAngle = Math.PI / 6;

            const x1 = shape.endX - headLength * Math.cos(angle - arrowAngle);
            const y1 = shape.endY - headLength * Math.sin(angle - arrowAngle);
            const x2 = shape.endX - headLength * Math.cos(angle + arrowAngle);
            const y2 = shape.endY - headLength * Math.sin(angle + arrowAngle);

            this.rc.line(shape.endX, shape.endY, x1, y1, options);
            this.rc.line(shape.endX, shape.endY, x2, y2, options);
        } else if (shape.type === "pencil") {
            if (shape.points.length > 1) {
                const pts = shape.points.map(p => [p.x, p.y] as [number, number]);
                this.rc.linearPath(pts, options);
            }
        } else if (shape.type === "text") {
            const fontFam = shape.fontFamily === "Caveat" 
                ? "Caveat, cursive, sans-serif" 
                : shape.fontFamily === "monospace" 
                ? "monospace" 
                : "sans-serif";

            this.ctx.font = `${shape.fontSize || 24}px ${fontFam}`;
            this.ctx.fillStyle = strokeColor;
            this.ctx.textBaseline = "top";
            
            // Multiline support
            const lines = shape.content.split("\n");
            const lineHeight = (shape.fontSize || 24) * 1.2;
            lines.forEach((line, i) => {
                this.ctx.fillText(line, shape.x, shape.y + i * lineHeight);
            });
        }


        this.ctx.restore();
    }

    // Bounding Box calculation
    public getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
        if (shape.type === "rect" || shape.type === "rectangle" || shape.type === "diamond") {
            const x = shape.width < 0 ? shape.x + shape.width : shape.x;
            const y = shape.height < 0 ? shape.y + shape.height : shape.y;
            return { x, y, width: Math.abs(shape.width), height: Math.abs(shape.height) };
        } else if (shape.type === "circle" || shape.type === "ellipse") {
            const rx = Math.abs(shape.radiusX || shape.radius);
            const ry = Math.abs(shape.radiusY || shape.radius);
            return {
                x: shape.centerX - rx,
                y: shape.centerY - ry,
                width: rx * 2,
                height: ry * 2
            };
        } else if (shape.type === "line" || shape.type === "arrow") {
            const minX = Math.min(shape.startX, shape.endX);
            const minY = Math.min(shape.startY, shape.endY);
            const maxX = Math.max(shape.startX, shape.endX);
            const maxY = Math.max(shape.startY, shape.endY);
            return { x: minX, y: minY, width: Math.max(20, maxX - minX), height: Math.max(20, maxY - minY) };
        } else if (shape.type === "pencil") {
            if (shape.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            shape.points.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            });
            return { x: minX, y: minY, width: Math.max(10, maxX - minX), height: Math.max(10, maxY - minY) };
        } else if (shape.type === "text") {
            const fontFam = shape.fontFamily === "Caveat" ? "Caveat, cursive, sans-serif" : shape.fontFamily === "monospace" ? "monospace" : "sans-serif";
            this.ctx.font = `${shape.fontSize || 24}px ${fontFam}`;
            const lines = shape.content.split("\n");
            let maxWidth = 40;
            lines.forEach(l => {
                const w = this.ctx.measureText(l).width;
                if (w > maxWidth) maxWidth = w;
            });
            const height = lines.length * (shape.fontSize || 24) * 1.2;
            return { x: shape.x, y: shape.y, width: maxWidth + 10, height: height + 5 };
        }

        return { x: 0, y: 0, width: 0, height: 0 };
    }

    // Draw Excalidraw-style selection box & resize handles
    private drawSelectionBox(shape: Shape) {
        const bounds = this.getShapeBounds(shape);
        const padding = 6;
        const bx = bounds.x - padding;
        const by = bounds.y - padding;
        const bw = bounds.width + padding * 2;
        const bh = bounds.height + padding * 2;

        this.ctx.save();
        this.ctx.strokeStyle = "#6965db"; // Authentic Excalidraw purple selection color
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([4, 4]);
        this.ctx.strokeRect(bx, by, bw, bh);
        this.ctx.setLineDash([]);

        // Handle squares
        const handleSize = 8 / this.zoom;
        const hs = handleSize;
        const handles = [
            { x: bx, y: by },                   // NW
            { x: bx + bw / 2, y: by },          // N
            { x: bx + bw, y: by },              // NE
            { x: bx + bw, y: by + bh / 2 },     // E
            { x: bx + bw, y: by + bh },         // SE
            { x: bx + bw / 2, y: by + bh },     // S
            { x: bx, y: by + bh },              // SW
            { x: bx, y: by + bh / 2 },          // W
        ];

        this.ctx.fillStyle = "#ffffff";
        this.ctx.strokeStyle = "#6965db";
        this.ctx.lineWidth = 1.5;

        handles.forEach(h => {
            this.ctx.fillRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
            this.ctx.strokeRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
        });

        this.ctx.restore();
    }

    // Check hit test for shape selection
    private hitTestShape(shape: Shape, worldX: number, worldY: number): boolean {
        const bounds = this.getShapeBounds(shape);
        const margin = 10;
        return (
            worldX >= bounds.x - margin &&
            worldX <= bounds.x + bounds.width + margin &&
            worldY >= bounds.y - margin &&
            worldY <= bounds.y + bounds.height + margin
        );
    }

    // Check hit test for handles
    private hitTestHandle(shape: Shape, worldX: number, worldY: number): ResizeHandle {
        const bounds = this.getShapeBounds(shape);
        const padding = 6;
        const bx = bounds.x - padding;
        const by = bounds.y - padding;
        const bw = bounds.width + padding * 2;
        const bh = bounds.height + padding * 2;

        const threshold = 12 / this.zoom;

        const handles: { handle: ResizeHandle; x: number; y: number }[] = [
            { handle: "nw", x: bx, y: by },
            { handle: "n", x: bx + bw / 2, y: by },
            { handle: "ne", x: bx + bw, y: by },
            { handle: "e", x: bx + bw, y: by + bh / 2 },
            { handle: "se", x: bx + bw, y: by + bh },
            { handle: "s", x: bx + bw / 2, y: by + bh },
            { handle: "sw", x: bx, y: by + bh },
            { handle: "w", x: bx, y: by + bh / 2 },
        ];

        for (const h of handles) {
            if (Math.hypot(worldX - h.x, worldY - h.y) <= threshold) {
                return h.handle;
            }
        }
        return null;
    }

    // Mouse handlers
    mouseDownHandler = (e: MouseEvent) => {
        // Pan canvas (Hand tool, middle click, space/ctrl click)
        if (this.selectedTool === "hand" || e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.canvas.style.cursor = "grabbing";
            return;
        }

        const world = this.screenToWorld(e.clientX, e.clientY);
        this.startX = world.x;
        this.startY = world.y;
        this.clicked = true;

        // Eraser tool action
        if (this.selectedTool === "eraser") {
            this.eraseAtPoint(world.x, world.y);
            return;
        }

        // Selection & Resize tool
        if (this.selectedTool === "selection") {
            if (this.selectedShapeId) {
                const selectedShape = this.existingShapes.find(s => s.id === this.selectedShapeId);
                if (selectedShape) {
                    const handle = this.hitTestHandle(selectedShape, world.x, world.y);
                    if (handle) {
                        this.isResizingShape = true;
                        this.activeHandle = handle;
                        this.initialShapeState = JSON.parse(JSON.stringify(selectedShape));
                        return;
                    }
                }
            }

            // Hit test shapes (top to bottom)
            let foundShape: Shape | null = null;
            for (let i = this.existingShapes.length - 1; i >= 0; i--) {
                if (this.hitTestShape(this.existingShapes[i], world.x, world.y)) {
                    foundShape = this.existingShapes[i];
                    break;
                }
            }

            if (foundShape) {
                this.selectedShapeId = foundShape.id;
                this.isDraggingShape = true;
                const bounds = this.getShapeBounds(foundShape);
                this.dragOffsetX = world.x - bounds.x;
                this.dragOffsetY = world.y - bounds.y;
                this.initialShapeState = JSON.parse(JSON.stringify(foundShape));
                if (this.onSelectionChange) this.onSelectionChange(foundShape);
            } else {
                this.selectedShapeId = null;
                if (this.onSelectionChange) this.onSelectionChange(null);
            }
            this.clearCanvas();
            return;
        }

        // Text tool action
        if (this.selectedTool === "text") {
            if (this.onTextInputRequested) {
                this.onTextInputRequested(e.clientX, e.clientY, "");
            }
            this.clicked = false;
            return;
        }

        // Pencil tool action
        if (this.selectedTool === "pencil") {
            this.currentPencilPoints = [{ x: world.x, y: world.y }];
        }
    };

    mouseUpHandler = (e: MouseEvent) => {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = "default";
            return;
        }

        if (!this.clicked && !this.isDraggingShape && !this.isResizingShape) return;

        const world = this.screenToWorld(e.clientX, e.clientY);
        const width = world.x - this.startX;
        const height = world.y - this.startY;

        if (this.isDraggingShape || this.isResizingShape) {
            this.isDraggingShape = false;
            this.isResizingShape = false;
            this.activeHandle = null;
            if (this.selectedShapeId) {
                const shape = this.existingShapes.find(s => s.id === this.selectedShapeId);
                if (shape) {
                    this.saveHistory();
                    this.broadcastShape(shape, "update");
                }
            }
            return;
        }

        if (this.selectedTool === "eraser" || this.selectedTool === "text" || this.selectedTool === "selection") {
            this.clicked = false;
            return;
        }

        this.clicked = false;
        let shape: Shape | null = null;
        const id = Math.random().toString(36).substring(2, 9);
        const opts = { ...this.options };

        if (this.selectedTool === "rectangle") {
            if (Math.abs(width) > 5 && Math.abs(height) > 5) {
                shape = {
                    type: "rect",
                    id,
                    x: width < 0 ? world.x : this.startX,
                    y: height < 0 ? world.y : this.startY,
                    width: Math.abs(width),
                    height: Math.abs(height),
                    ...opts
                };
            }
        } else if (this.selectedTool === "diamond") {
            if (Math.abs(width) > 5 && Math.abs(height) > 5) {
                shape = {
                    type: "diamond",
                    id,
                    x: width < 0 ? world.x : this.startX,
                    y: height < 0 ? world.y : this.startY,
                    width: Math.abs(width),
                    height: Math.abs(height),
                    ...opts
                };
            }
        } else if (this.selectedTool === "ellipse") {
            const rx = Math.abs(width) / 2;
            const ry = Math.abs(height) / 2;
            if (rx > 3 && ry > 3) {
                shape = {
                    type: "circle",
                    id,
                    radius: Math.max(rx, ry),
                    radiusX: rx,
                    radiusY: ry,
                    centerX: this.startX + width / 2,
                    centerY: this.startY + height / 2,
                    ...opts
                };
            }
        } else if (this.selectedTool === "arrow") {
            if (Math.hypot(width, height) > 5) {
                shape = {
                    type: "arrow",
                    id,
                    startX: this.startX,
                    startY: this.startY,
                    endX: world.x,
                    endY: world.y,
                    ...opts
                };
            }
        } else if (this.selectedTool === "line") {
            if (Math.hypot(width, height) > 5) {
                shape = {
                    type: "line",
                    id,
                    startX: this.startX,
                    startY: this.startY,
                    endX: world.x,
                    endY: world.y,
                    ...opts
                };
            }
        } else if (this.selectedTool === "pencil") {
            if (this.currentPencilPoints.length > 1) {
                shape = {
                    type: "pencil",
                    id,
                    points: this.currentPencilPoints,
                    ...opts
                };
            }
            this.currentPencilPoints = [];
        }

        if (shape) {
            this.saveHistory();
            this.existingShapes.push(shape);
            this.broadcastShape(shape, "create");
            this.clearCanvas();
        }
    };

    mouseMoveHandler = (e: MouseEvent) => {
        // Panning
        if (this.isPanning) {
            const dx = e.clientX - this.lastPanX;
            const dy = e.clientY - this.lastPanY;
            this.offsetX += dx;
            this.offsetY += dy;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.clearCanvas();
            return;
        }

        const world = this.screenToWorld(e.clientX, e.clientY);

        // Eraser drag
        if (this.selectedTool === "eraser" && this.clicked) {
            this.eraseAtPoint(world.x, world.y);
            return;
        }

        // Resizing shape
        if (this.isResizingShape && this.selectedShapeId && this.initialShapeState) {
            const shapeIdx = this.existingShapes.findIndex(s => s.id === this.selectedShapeId);
            if (shapeIdx !== -1) {
                const shape = { ...this.existingShapes[shapeIdx] };
                const handle = this.activeHandle;
                
                if (shape.type === "rect" || shape.type === "rectangle" || shape.type === "diamond") {
                    if (handle === "se") {
                        shape.width = Math.max(10, world.x - shape.x);
                        shape.height = Math.max(10, world.y - shape.y);
                    } else if (handle === "nw") {
                        const newW = shape.x + shape.width - world.x;
                        const newH = shape.y + shape.height - world.y;
                        if (newW > 10) { shape.x = world.x; shape.width = newW; }
                        if (newH > 10) { shape.y = world.y; shape.height = newH; }
                    } else if (handle === "ne") {
                        shape.width = Math.max(10, world.x - shape.x);
                        const newH = shape.y + shape.height - world.y;
                        if (newH > 10) { shape.y = world.y; shape.height = newH; }
                    } else if (handle === "sw") {
                        const newW = shape.x + shape.width - world.x;
                        if (newW > 10) { shape.x = world.x; shape.width = newW; }
                        shape.height = Math.max(10, world.y - shape.y);
                    }
                } else if (shape.type === "circle" || shape.type === "ellipse") {
                    const rx = Math.abs(world.x - shape.centerX);
                    const ry = Math.abs(world.y - shape.centerY);
                    shape.radiusX = Math.max(5, rx);
                    shape.radiusY = Math.max(5, ry);
                    shape.radius = Math.max(rx, ry);
                } else if (shape.type === "line" || shape.type === "arrow") {
                    shape.endX = world.x;
                    shape.endY = world.y;
                }

                this.existingShapes[shapeIdx] = shape;
                this.clearCanvas();
            }
            return;
        }

        // Dragging shape
        if (this.isDraggingShape && this.selectedShapeId) {
            const shapeIdx = this.existingShapes.findIndex(s => s.id === this.selectedShapeId);
            if (shapeIdx !== -1) {
                const shape = { ...this.existingShapes[shapeIdx] };
                const dx = world.x - this.startX;
                const dy = world.y - this.startY;

                if (shape.type === "rect" || shape.type === "rectangle" || shape.type === "diamond" || shape.type === "text") {
                    shape.x += dx;
                    shape.y += dy;
                } else if (shape.type === "circle" || shape.type === "ellipse") {
                    shape.centerX += dx;
                    shape.centerY += dy;
                } else if (shape.type === "line" || shape.type === "arrow") {
                    shape.startX += dx;
                    shape.startY += dy;
                    shape.endX += dx;
                    shape.endY += dy;
                } else if (shape.type === "pencil") {
                    shape.points = shape.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
                }

                this.startX = world.x;
                this.startY = world.y;
                this.existingShapes[shapeIdx] = shape;
                this.clearCanvas();
            }
            return;
        }

        // Drawing preview
        if (this.clicked && this.selectedTool !== "selection") {
            const width = world.x - this.startX;
            const height = world.y - this.startY;

            this.clearCanvas();
            this.ctx.save();
            this.ctx.translate(this.offsetX, this.offsetY);
            this.ctx.scale(this.zoom, this.zoom);

            const previewOpts: Shape = {
                id: "preview",
                type: "rect",
                x: this.startX,
                y: this.startY,
                width,
                height,
                ...this.options
            };

            if (this.selectedTool === "rectangle") {
                this.drawShape({ ...previewOpts, type: "rect" }, true);
            } else if (this.selectedTool === "diamond") {
                this.drawShape({ ...previewOpts, type: "diamond" }, true);
            } else if (this.selectedTool === "ellipse") {
                const rx = Math.abs(width) / 2;
                const ry = Math.abs(height) / 2;
                this.drawShape({
                    ...previewOpts,
                    type: "circle",
                    radius: Math.max(rx, ry),
                    radiusX: rx,
                    radiusY: ry,
                    centerX: this.startX + width / 2,
                    centerY: this.startY + height / 2
                }, true);
            } else if (this.selectedTool === "arrow") {
                this.drawShape({
                    ...previewOpts,
                    type: "arrow",
                    startX: this.startX,
                    startY: this.startY,
                    endX: world.x,
                    endY: world.y
                }, true);
            } else if (this.selectedTool === "line") {
                this.drawShape({
                    ...previewOpts,
                    type: "line",
                    startX: this.startX,
                    startY: this.startY,
                    endX: world.x,
                    endY: world.y
                }, true);
            } else if (this.selectedTool === "pencil") {
                this.currentPencilPoints.push({ x: world.x, y: world.y });
                this.drawShape({
                    ...previewOpts,
                    type: "pencil",
                    points: this.currentPencilPoints
                }, true);
            }

            this.ctx.restore();
        }
    };

    // Zoom on mouse wheel
    wheelHandler = (e: WheelEvent) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.max(0.1, Math.min(5, this.zoom * zoomFactor));

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        this.offsetX = mouseX - (mouseX - this.offsetX) * (newZoom / this.zoom);
        this.offsetY = mouseY - (mouseY - this.offsetY) * (newZoom / this.zoom);

        this.setZoom(newZoom);
    };

    keyDownHandler = (e: KeyboardEvent) => {
        // Don't trigger shortcuts if user is typing in input
        if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
            return;
        }

        if (e.key === "Delete" || e.key === "Backspace") {
            if (this.selectedShapeId) {
                this.deleteSelectedShape();
            }
        } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
            if (e.shiftKey) {
                this.redo();
            } else {
                this.undo();
            }
        } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
            this.redo();
        } else if ((e.ctrlKey || e.metaKey) && e.key === "d") {
            e.preventDefault();
            this.duplicateSelectedShape();
        }
    };

    private eraseAtPoint(x: number, y: number) {
        let deletedAny = false;
        this.existingShapes = this.existingShapes.filter(s => {
            const hit = this.hitTestShape(s, x, y);
            if (hit) {
                deletedAny = true;
                this.broadcastDelete(s.id);
            }
            return !hit;
        });

        if (deletedAny) {
            this.saveHistory();
            this.clearCanvas();
        }
    }

    public deleteSelectedShape() {
        if (!this.selectedShapeId) return;
        this.saveHistory();
        const id = this.selectedShapeId;
        this.existingShapes = this.existingShapes.filter(s => s.id !== id);
        this.selectedShapeId = null;
        if (this.onSelectionChange) this.onSelectionChange(null);
        this.broadcastDelete(id);
        this.clearCanvas();
    }

    public duplicateSelectedShape() {
        if (!this.selectedShapeId) return;
        const shape = this.existingShapes.find(s => s.id === this.selectedShapeId);
        if (!shape) return;

        this.saveHistory();
        const newShape: Shape = JSON.parse(JSON.stringify(shape));
        newShape.id = Math.random().toString(36).substring(2, 9);
        
        // Offset duplicate slightly
        const offset = 20;
        if (newShape.type === "rect" || newShape.type === "rectangle" || newShape.type === "diamond" || newShape.type === "text") {
            newShape.x += offset;
            newShape.y += offset;
        } else if (newShape.type === "circle" || newShape.type === "ellipse") {
            newShape.centerX += offset;
            newShape.centerY += offset;
        } else if (newShape.type === "line" || newShape.type === "arrow") {
            newShape.startX += offset;
            newShape.startY += offset;
            newShape.endX += offset;
            newShape.endY += offset;
        } else if (newShape.type === "pencil") {
            newShape.points = newShape.points.map(p => ({ x: p.x + offset, y: p.y + offset }));
        }

        this.existingShapes.push(newShape);
        this.selectedShapeId = newShape.id;
        if (this.onSelectionChange) this.onSelectionChange(newShape);
        this.broadcastShape(newShape, "create");
        this.clearCanvas();
    }

    // Add text shape
    public addText(x: number, y: number, content: string, shapeId?: string) {
        if (!content.trim()) return;

        const world = this.screenToWorld(x, y);

        if (shapeId) {
            const idx = this.existingShapes.findIndex(s => s.id === shapeId);
            if (idx !== -1) {
                this.saveHistory();
                const shape = { ...this.existingShapes[idx] } as TextShape;
                shape.content = content;
                this.existingShapes[idx] = shape;
                this.broadcastShape(shape, "update");
                this.clearCanvas();
                return;
            }
        }

        this.saveHistory();
        const textShape: TextShape = {
            id: Math.random().toString(36).substring(2, 9),
            type: "text",
            x: world.x,
            y: world.y,
            content,
            fontSize: this.options.fontSize,
            fontFamily: this.options.fontFamily,
            stroke: this.options.stroke,
            opacity: this.options.opacity
        };

        this.existingShapes.push(textShape);
        this.selectedShapeId = textShape.id;
        if (this.onSelectionChange) this.onSelectionChange(textShape);
        this.broadcastShape(textShape, "create");
        this.clearCanvas();
    }

    // WebSocket Broadcasting
    private broadcastShape(shape: Shape, action: "create" | "update" = "create") {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape, action }),
                roomId: this.roomId
            }));
        }
    }

    private broadcastDelete(id: string) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ action: "delete", id }),
                roomId: this.roomId
            }));
        }
    }

    doubleClickHandler = (e: MouseEvent) => {
        const world = this.screenToWorld(e.clientX, e.clientY);
        for (let i = this.existingShapes.length - 1; i >= 0; i--) {
            const shape = this.existingShapes[i];
            if (shape.type === "text" && this.hitTestShape(shape, world.x, world.y)) {
                const screen = this.worldToScreen(shape.x, shape.y);
                if (this.onTextInputRequested) {
                    this.onTextInputRequested(screen.x, screen.y, shape.content, shape.id);
                }
                return;
            }
        }
    };

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.addEventListener("dblclick", this.doubleClickHandler);
        this.canvas.addEventListener("wheel", this.wheelHandler, { passive: false });
    }


    initKeyHandlers() {
        window.addEventListener("keydown", this.keyDownHandler);
    }

    exportShapes() {
        return {
            version: 2,
            theme: this.theme,
            shapes: this.existingShapes,
            timestamp: Date.now()
        };
    }

    importShapes(data: { shapes?: Shape[] }) {
        if (data.shapes && Array.isArray(data.shapes)) {
            this.saveHistory();
            const normalized = data.shapes.map(s => this.normalizeShape(s));
            this.existingShapes = [...this.existingShapes, ...normalized];
            this.clearCanvas();

            if (this.socket.readyState === WebSocket.OPEN) {
                normalized.forEach(shape => {
                    this.broadcastShape(shape, "create");
                });
            }
        }
    }

    clearAll() {
        this.saveHistory();
        this.existingShapes = [];
        this.selectedShapeId = null;
        if (this.onSelectionChange) this.onSelectionChange(null);
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ action: "clear" }),
                roomId: this.roomId
            }));
        }
        this.clearCanvas();
    }
}