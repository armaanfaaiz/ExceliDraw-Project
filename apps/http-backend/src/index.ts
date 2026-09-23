import { Buffer } from "buffer";
if (typeof (Buffer as any).SlowBuffer === "undefined") {
    function SlowBuffer() {}
    (SlowBuffer as any).prototype = Object.create(Buffer.prototype);
    (Buffer as any).SlowBuffer = SlowBuffer;
}
if (typeof (globalThis as any).SlowBuffer === "undefined") {
    (globalThis as any).SlowBuffer = (Buffer as any).SlowBuffer;
}

import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import crypto from "crypto";

import { JWT_SECRET } from '@repo/backend-common';
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

const app = express();
app.use(express.json());
app.use(cors());

function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return password === storedHash;
    try {
        const verifyHash = crypto.scryptSync(password, salt, 64);
        return crypto.timingSafeEqual(Buffer.from(hash, "hex"), verifyHash);
    } catch {
        return false;
    }
}

app.post("/signup", async (req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({ message: "Incorrect inputs" });
        return;
    }
    try {
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data.username,
                password: hashPassword(parsedData.data.password),
                name: parsedData.data.name
            }
        });
        res.json({ userId: user.id });
    } catch {
        res.status(411).json({ message: "User already exists" });
    }
});

app.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({ message: "Incorrect inputs" });
        return;
    }
    const user = await prismaClient.user.findFirst({
        where: { email: parsedData.data.username }
    });
    if (!user || !verifyPassword(parsedData.data.password, user.password)) {
        res.status(403).json({ message: "Not authorized" });
        return;
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token });
});

app.post("/room", middleware, async (req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    const userId = req.userId!;
    try {
        const roomName = parsedData.success ? parsedData.data.name : `canvas-${Date.now()}`;
        const room = await prismaClient.room.create({
            data: { slug: roomName, adminId: userId }
        });
        res.json({ roomId: room.id, roomName: room.slug });
    } catch {
        res.status(411).json({ message: "Room creation failed" });
    }
});

app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomIdStr = req.params.roomId;
        let room = await prismaClient.room.findUnique({ where: { slug: roomIdStr } });
        if (!room && !isNaN(Number(roomIdStr))) {
            room = await prismaClient.room.findUnique({ where: { id: Number(roomIdStr) } });
        }
        if (!room) {
            res.json({ messages: [] });
            return;
        }
        const messages = await prismaClient.chat.findMany({
            where: { roomId: room.id },
            orderBy: { id: "asc" },
            take: 1000
        });
        res.json({ messages });
    } catch {
        res.json({ messages: [] });
    }
});

app.get("/room/:slug", async (req, res) => {
    const room = await prismaClient.room.findFirst({
        where: { slug: req.params.slug }
    });
    res.json({ room });
});

app.get("/my-rooms", middleware, async (req, res) => {
    const rooms = await prismaClient.room.findMany({
        where: { adminId: req.userId! },
        orderBy: { createdAt: "desc" }
    });
    res.json({ rooms });
});

const PORT = process.env.PORT || 3002;
app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`HTTP server running on port ${PORT}`);
});