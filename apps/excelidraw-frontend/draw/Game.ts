import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    type: "pencil";
    points: {x: number, y: number}[];
} | {
    type: "text";
    x: number;
    y: number;
    content: string;
    fontSize: number;
}

export class Game {

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[]
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "pencil";
    private currentPencilPoints: {x: number, y: number}[] = [];
    
    // Pan and zoom
    private offsetX = 0;
    private offsetY = 0;
    private scale = 1;
    private isPanning = false;
    private lastPanX = 0;
    private lastPanY = 0;
    
    // Smooth drawing
    private animationFrameId: number | null = null;
    private pendingDraw = false;

    socket: WebSocket;
    onTextInput: ((x: number, y: number) => void) | null = null;
    private messageHandler: ((event: MessageEvent) => void) | null = null;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }
    
    destroy() {
        // Remove mouse event listeners
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler)
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler)
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler)
        
        // Remove WebSocket message listener
        if (this.messageHandler) {
            this.socket.removeEventListener("message", this.messageHandler);
        }
    }

    setTool(tool: Tool) {
        this.selectedTool = tool;
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        console.log(this.existingShapes);
        this.clearCanvas();
    }
    
    private sendJoinRoom() {
        this.socket.send(JSON.stringify({
            type: "join_room",
            roomId: this.roomId
        }));
    }

    initHandlers() {
        // Handle WebSocket open - join room
        // Socket may already be open when Game is constructed, so check first
        if (this.socket.readyState === WebSocket.OPEN) {
            console.log("Socket already open, sending join_room immediately");
            this.sendJoinRoom();
        } else {
            this.socket.onopen = () => {
                console.log("WebSocket opened, sending join_room message");
                this.sendJoinRoom();
            };
        }
        
        // Handle incoming messages using addEventListener to not overwrite page.tsx handler
        this.messageHandler = (event: MessageEvent) => {
            console.log("Game.ts WebSocket message received:", event.data);
            const message = JSON.parse(event.data);

            if (message.type === "chat") {
                console.log("Chat message received, adding shape");
                try {
                    const parsedData = JSON.parse(message.message);
                    if (parsedData.shape) {
                        this.existingShapes.push(parsedData.shape);
                        this.clearCanvas();
                    }
                } catch (e) {
                    console.error("Error parsing shape:", e);
                }
            }
            // Note: user_count messages are handled by page.tsx's onmessage handler
        };
        this.socket.addEventListener("message", this.messageHandler);
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0)"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.existingShapes.map((shape) => {
            if (shape.type === "rect") {
                this.ctx.strokeStyle = "rgba(255, 255, 255)"
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "circle") {
                console.log(shape);
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();                
            } else if (shape.type === "pencil") {
                if (shape.points.length > 0) {
                    this.drawSmoothLine(shape.points);
                }
            } else if (shape.type === "text") {
                this.ctx.fillStyle = "rgba(255, 255, 255)";
                this.ctx.font = `${shape.fontSize}px Arial`;
                this.ctx.fillText(shape.content, shape.x, shape.y);
            }
        })
    }

    mouseDownHandler = (e: MouseEvent) => {
        // Handle pan with middle mouse or space+drag
        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
            return;
        }
        
        // Handle text tool
        if (this.selectedTool === "text") {
            if (this.onTextInput) {
                this.onTextInput(e.clientX, e.clientY);
            }
            return;
        }
        
        this.clicked = true
        this.startX = e.clientX
        this.startY = e.clientY
        
        if (this.selectedTool === "pencil") {
            this.currentPencilPoints = [{x: e.clientX, y: e.clientY}];
        }
    }
    mouseUpHandler = (e: MouseEvent) => {
        // Handle pan end
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
            return;
        }
        
        // Don't create shapes for text tool (handled separately)
        if (this.selectedTool === "text") {
            return;
        }
        
        this.clicked = false
        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;

        const selectedTool = this.selectedTool;
        let shape: Shape | null = null;
        if (selectedTool === "rect") {
            // Only create if there's actual size
            if (Math.abs(width) > 5 && Math.abs(height) > 5) {
                shape = {
                    type: "rect",
                    x: this.startX,
                    y: this.startY,
                    height,
                    width
                }
            }
        } else if (selectedTool === "circle") {
            const radius = Math.max(width, height) / 2;
            if (radius > 5) {
                shape = {
                    type: "circle",
                    radius: radius,
                    centerX: this.startX + radius,
                    centerY: this.startY + radius,
                }
            }
        } else if (selectedTool === "pencil") {
            if (this.currentPencilPoints.length > 2) {
                // Smooth the points
                const smoothedPoints = this.smoothPoints(this.currentPencilPoints);
                shape = {
                    type: "pencil",
                    points: smoothedPoints
                }
            }
            this.currentPencilPoints = [];
        }

        if (!shape) {
            return;
        }

        this.existingShapes.push(shape);

        if (this.socket.readyState === WebSocket.OPEN) {
            const messageData = JSON.stringify({
                type: "chat",
                message: JSON.stringify({
                    shape
                }),
                roomId: this.roomId
            });
            console.log("Sending shape to server:", messageData);
            this.socket.send(messageData);
        } else {
            console.error("WebSocket is not open, cannot send message");
        }
    }
    mouseMoveHandler = (e: MouseEvent) => {
        // Handle panning
        if (this.isPanning) {
            const dx = e.clientX - this.lastPanX;
            const dy = e.clientY - this.lastPanY;
            this.offsetX += dx;
            this.offsetY += dy;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
            return;
        }
        
        if (this.clicked) {
            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;
            
            // Use requestAnimationFrame for smooth preview
            if (!this.pendingDraw) {
                this.pendingDraw = true;
                this.animationFrameId = requestAnimationFrame(() => {
                    this.pendingDraw = false;
                    this.clearCanvas();
                    this.ctx.strokeStyle = "rgba(255, 255, 255)"
                    const selectedTool = this.selectedTool;
                    
                    // Redraw existing shapes
                    this.drawExistingShapes();
                    
                    // Draw preview
                    if (selectedTool === "rect") {
                        this.ctx.strokeRect(this.startX, this.startY, width, height);   
                    } else if (selectedTool === "circle") {
                        const radius = Math.max(width, height) / 2;
                        const centerX = this.startX + radius;
                        const centerY = this.startY + radius;
                        this.ctx.beginPath();
                        this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                        this.ctx.stroke();
                        this.ctx.closePath();                
                    } else if (selectedTool === "pencil") {
                        this.currentPencilPoints.push({x: e.clientX, y: e.clientY});
                        
                        // Draw smooth preview
                        if (this.currentPencilPoints.length > 0) {
                            this.drawSmoothLine(this.currentPencilPoints, true);
                        }
                    }
                });
            }
        }
    }
    
    // Smooth line drawing using quadratic curves
    private drawSmoothLine(points: {x: number, y: number}[], isPreview = false) {
        if (points.length < 2) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        // Use quadratic curves for smoother lines
        for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        
        // Connect to last point
        if (points.length > 1) {
            this.ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        }
        
        this.ctx.stroke();
        if (!isPreview) {
            this.ctx.closePath();
        }
    }
    
    // Douglas-Peucker algorithm for point simplification
    private smoothPoints(points: {x: number, y: number}[]): {x: number, y: number}[] {
        if (points.length <= 2) return points;
        
        // Simple distance-based smoothing
        const smoothed: {x: number, y: number}[] = [points[0]];
        let lastPoint = points[0];
        
        for (let i = 1; i < points.length; i++) {
            const dist = Math.hypot(points[i].x - lastPoint.x, points[i].y - lastPoint.y);
            if (dist > 3) { // Only keep points that are at least 3 pixels apart
                smoothed.push(points[i]);
                lastPoint = points[i];
            }
        }
        
        // Always include last point
        if (smoothed[smoothed.length - 1] !== points[points.length - 1]) {
            smoothed.push(points[points.length - 1]);
        }
        
        return smoothed;
    }
    
    private drawExistingShapes() {
        this.existingShapes.forEach((shape) => {
            if (shape.type === "rect") {
                this.ctx.strokeStyle = "rgba(255, 255, 255)"
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "circle") {
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();                
            } else if (shape.type === "pencil") {
                if (shape.points.length > 0) {
                    this.drawSmoothLine(shape.points);
                }
            } else if (shape.type === "text") {
                this.ctx.fillStyle = "rgba(255, 255, 255)";
                this.ctx.font = `${shape.fontSize}px Arial`;
                this.ctx.fillText(shape.content, shape.x, shape.y);
            }
        });
    }
    
    // Add text shape
    addText(x: number, y: number, content: string, fontSize = 20) {
        const shape: Shape = {
            type: "text",
            x,
            y,
            content,
            fontSize
        };
        
        this.existingShapes.push(shape);
        this.clearCanvas();
        
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape }),
                roomId: this.roomId
            }));
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)

        this.canvas.addEventListener("mouseup", this.mouseUpHandler)

        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)    

    }
}