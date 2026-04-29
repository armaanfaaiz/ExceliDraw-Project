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

// Attach WebSocket server to HTTP server with optimizations
const wss = new WebSocketServer({ 
  server,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10
  }
});

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

  users.push({
    userId,
    rooms: [],
    ws
  })

  ws.on('message', async function message(data) {
    let parsedData;
    if (typeof data !== "string") {
      parsedData = JSON.parse(data.toString());
    } else {
      parsedData = JSON.parse(data); // {type: "join-room", roomId: 1}
    }

    if (parsedData.type === "join_room") {
      const user = users.find(x => x.ws === ws);
      user?.rooms.push(parsedData.roomId);
    }

    if (parsedData.type === "leave_room") {
      const user = users.find(x => x.ws === ws);
      if (!user) {
        return;
      }
      user.rooms = user?.rooms.filter(x => x === parsedData.room);
    }

    console.log("message received")
    console.log(parsedData);

    if (parsedData.type === "chat") {
      const roomSlug = parsedData.roomId;
      const message = parsedData.message;

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
          roomId: room.id, // Use the room's numeric ID
          message,
          userId
        }
      });

      users.forEach(user => {
        if (user.rooms.includes(roomSlug)) {
          user.ws.send(JSON.stringify({
            type: "chat",
            message: message,
            roomId: roomSlug
          }))
        }
      })
    }

  });

});

