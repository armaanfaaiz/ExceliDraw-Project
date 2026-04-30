import { WebSocket, WebSocketServer } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common';
import { prismaClient } from "@repo/db/client";
import http from 'http';

const PORT = process.env.PORT || 8080;

// Create HTTP server for Render compatibility
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running\n');
});

// Attach WebSocket server to HTTP server
const wss = new WebSocketServer({ server });

server.listen(Number(PORT), () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// Keepalive ping to prevent connection drops
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const extWs = ws as WebSocket;
    if (extWs.readyState === WebSocket.OPEN) {
      extWs.ping();
    }
  });
}, 30000); // Ping every 30 seconds

wss.on('close', () => {
  clearInterval(interval);
});

interface User {
  ws: WebSocket,
  rooms: string[],
  userId: string
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded == "string") {
      return null;
    }

    if (!decoded || !decoded.userId) {
      return null;
    }

    return decoded.userId;
  } catch(e) {
    return null;
  }
  return null;
}

// Track users per room for count
function getRoomUserCount(roomId: string): number {
  return users.filter(u => u.rooms.includes(roomId)).length;
}

function broadcastUserCount(roomId: string) {
  const count = getRoomUserCount(roomId);
  users.forEach(user => {
    if (user.rooms.includes(roomId)) {
      user.ws.send(JSON.stringify({
        type: "user_count",
        count: count,
        roomId: roomId
      }));
    }
  });
}

wss.on('connection', function connection(ws, request) {
  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";
  const userId = checkUser(token);

  if (userId == null) {
    ws.close()
    return null;
  }

  const user = {
    userId,
    rooms: [] as string[],
    ws
  };
  
  users.push(user);

  ws.on('message', async function message(data) {
    let parsedData;
    if (typeof data !== "string") {
      parsedData = JSON.parse(data.toString());
    } else {
      parsedData = JSON.parse(data); // {type: "join-room", roomId: 1}
    }

    if (parsedData.type === "join_room") {
      const roomId = parsedData.roomId;
      if (!user.rooms.includes(roomId)) {
        user.rooms.push(roomId);
        console.log(`User ${userId} joined room ${roomId}. Total users: ${getRoomUserCount(roomId)}`);
        // Broadcast updated user count
        broadcastUserCount(roomId);
      }
    }

    if (parsedData.type === "leave_room") {
      const roomId = parsedData.room;
      if (user.rooms.includes(roomId)) {
        user.rooms = user.rooms.filter(x => x !== roomId);
        console.log(`User ${userId} left room ${roomId}. Total users: ${getRoomUserCount(roomId)}`);
        broadcastUserCount(roomId);
      }
    }

    console.log("message received")
    console.log(parsedData);

    if (parsedData.type === "chat") {
      const roomSlug = parsedData.roomId;
      const message = parsedData.message;
      
      console.log(`Broadcasting chat to room ${roomSlug}. User rooms:`, user.rooms);
      console.log(`Total users in system:`, users.length);

      // Find room by slug to get its ID
      const room = await prismaClient.room.findUnique({
        where: { slug: roomSlug }
      });

      if (!room) {
        console.error("Room not found:", roomSlug);
        return;
      }

      await prismaClient.chat.create({
        data: {
          roomId: room.id,
          message,
          userId
        }
      });

      let broadcastCount = 0;
      users.forEach(u => {
        console.log(`Checking user ${u.userId}, rooms:`, u.rooms, `includes ${roomSlug}?`, u.rooms.includes(roomSlug));
        if (u.rooms.includes(roomSlug)) {
          u.ws.send(JSON.stringify({
            type: "chat",
            message: message,
            roomId: roomSlug
          }));
          broadcastCount++;
        }
      });
      console.log(`Broadcast chat to ${broadcastCount} users in room ${roomSlug}`);
    }

  });
  
  // Handle disconnect - remove user from all rooms and broadcast
  ws.on('close', () => {
    console.log(`User ${userId} disconnected`);
    // Get all rooms this user was in
    const roomsToUpdate = [...user.rooms];
    // Remove user from tracking
    const index = users.findIndex(u => u.ws === ws);
    if (index > -1) {
      users.splice(index, 1);
    }
    // Broadcast updated counts for all rooms they were in
    roomsToUpdate.forEach(roomId => {
      broadcastUserCount(roomId);
    });
  });

});

