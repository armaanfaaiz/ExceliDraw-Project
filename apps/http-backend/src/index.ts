import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common';
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import cors from "cors";

const app = express();
app.use(express.json());

// CORS configuration for production
app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true
}));

app.post("/signup", async (req, res) => {

    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        console.log(parsedData.error);
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    try {
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data?.username,
                // TODO: Hash the pw
                password: parsedData.data.password,
                name: parsedData.data.name
            }
        })
        res.json({
            userId: user.id
        })
    } catch(e) {
        res.status(411).json({
            message: "User already exists with this username"
        })
    }
})

app.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    // TODO: Compare the hashed pws here
    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username,
            password: parsedData.data.password
        }
    })

    if (!user) {
        res.status(403).json({
            message: "Not authorized"
        })
        return;
    }

    const token = jwt.sign({
        userId: user?.id
    }, JWT_SECRET);

    res.json({
        token
    })
})

app.post("/room", middleware, async (req, res) => {
    // @ts-ignore: TODO: Fix this
    const userId = req.userId;

    try {
        // Get the count of existing rooms for this user
        const existingRoomsCount = await prismaClient.room.count({
            where: {
                adminId: userId
            }
        });

        // Generate canvas name as canvas-{number}
        const canvasName = `canvas-${existingRoomsCount + 1}`;

        const room = await prismaClient.room.create({
            data: {
                slug: canvasName,
                adminId: userId
            }
        })

        res.json({
            roomId: room.id,
            roomName: canvasName
        })
    } catch(e) {
        res.status(411).json({
            message: "Failed to create room"
        })
    }
})

app.get("/chats/:roomSlug", async (req, res) => {
    try {
        const roomSlug = req.params.roomSlug;
        console.log("Fetching chats for room:", roomSlug);

        // Find room by slug first to get the numeric ID
        const room = await prismaClient.room.findUnique({
            where: { slug: roomSlug }
        });

        if (!room) {
            console.error("Room not found:", roomSlug);
            res.json({ messages: [] });
            return;
        }

        const messages = await prismaClient.chat.findMany({
            where: {
                roomId: room.id
            },
            orderBy: {
                id: "asc"
            },
            take: 1000
        });

        res.json({
            messages
        })
    } catch(e) {
        console.log(e);
        res.json({
            messages: []
        })
    }
    
})

app.get("/room/:slug", async (req, res) => {
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where: {
            slug
        }
    });

    res.json({
        room
    })
})

app.get("/my-rooms", middleware, async (req, res) => {
    // @ts-ignore: TODO: Fix this
    const userId = req.userId;

    try {
        const rooms = await prismaClient.room.findMany({
            where: {
                adminId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            rooms
        });
    } catch(e) {
        res.status(500).json({
            message: "Failed to fetch rooms"
        });
    }
})

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`HTTP Backend running on port ${PORT}`);
});