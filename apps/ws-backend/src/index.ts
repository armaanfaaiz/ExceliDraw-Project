import { Buffer } from "buffer";
if (typeof (Buffer as any).SlowBuffer === "undefined") {
    function SlowBuffer() {}
    (SlowBuffer as any).prototype = Object.create(Buffer.prototype);
    (Buffer as any).SlowBuffer = SlowBuffer;
}
if (typeof (globalThis as any).SlowBuffer === "undefined") {
    (globalThis as any).SlowBuffer = (Buffer as any).SlowBuffer;
}

import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import http from "http";
import { JWT_SECRET } from "@repo/backend-common";
import { prismaClient } from "@repo/db/client";

const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WebSocket server running\n");
});

const wss = new WebSocketServer({ server });

server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`WebSocket server running on port ${PORT}`);
});

interface User {
    ws: WebSocket;
    rooms: string[];
    userId: string;
}

const users: User[] = [];

function checkUser(token: string): string | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        return decoded?.userId || null;
    } catch {
        return null;
    }
}

function broadcastUserCount(roomId: string) {
    const count = users.filter(u => u.rooms.includes(roomId)).length;
    users.forEach(u => {
        if (u.rooms.includes(roomId)) {
            u.ws.send(JSON.stringify({ type: "user_count", count, roomId }));
        }
    });
}

wss.on("connection", (ws, request) => {
    const queryParams = new URLSearchParams(request.url?.split("?")[1]);
    const token = queryParams.get("token") || "";
    const userId = checkUser(token);

    if (!userId) {
        ws.close();
        return;
    }

    const user: User = { userId, rooms: [], ws };
    users.push(user);

    ws.on("message", async (data) => {
        const parsed = JSON.parse(data.toString());

        if (parsed.type === "join_room") {
            const roomId = parsed.roomId;
            if (!user.rooms.includes(roomId)) {
                user.rooms.push(roomId);
                broadcastUserCount(roomId);
            }
        }

        if (parsed.type === "leave_room") {
            const roomId = parsed.room;
            user.rooms = user.rooms.filter(r => r !== roomId);
            broadcastUserCount(roomId);
        }

        if (parsed.type === "chat") {
            const roomIdStr = parsed.roomId;
            const message = parsed.message;

            let room = await prismaClient.room.findUnique({ where: { slug: roomIdStr } });
            if (!room && !isNaN(Number(roomIdStr))) {
                room = await prismaClient.room.findUnique({ where: { id: Number(roomIdStr) } });
            }

            if (room) {
                await prismaClient.chat.create({
                    data: { roomId: room.id, message, userId }
                });
            }

            users.forEach(u => {
                if (u.rooms.includes(roomIdStr)) {
                    u.ws.send(JSON.stringify({ type: "chat", message, roomId: roomIdStr }));
                }
            });
        }
    });

    ws.on("close", () => {
        const roomsToUpdate = [...user.rooms];
        const index = users.findIndex(u => u.ws === ws);
        if (index > -1) users.splice(index, 1);
        roomsToUpdate.forEach(r => broadcastUserCount(r));
    });
});
