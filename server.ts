import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Socket.io logic
  const rooms = new Map<string, any>();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("createRoom", (data) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      rooms.set(roomId, {
        host: socket.id,
        board: data.board,
        players: [{ id: socket.id, name: data.playerName, isHost: true }],
        status: "waiting",
        assignments: {}
      });
      socket.join(roomId);
      socket.emit("roomCreated", { roomId, room: rooms.get(roomId) });
    });

    socket.on("joinRoom", (data) => {
      const room = rooms.get(data.roomId);
      if (room) {
        if (room.status !== "waiting") {
          socket.emit("error", { message: "Game already started" });
          return;
        }
        room.players.push({ id: socket.id, name: data.playerName, isHost: false });
        socket.join(data.roomId);
        io.to(data.roomId).emit("roomUpdated", room);
        socket.emit("joinedRoom", { roomId: data.roomId, room });
      } else {
        socket.emit("error", { message: "Room not found" });
      }
    });

    socket.on("startGame", (data) => {
      const room = rooms.get(data.roomId);
      if (room && room.host === socket.id) {
        room.status = "playing";
        
        // Assign random characters
        const availableCharacters = room.board.slots.filter((s: any) => s.image);
        const shuffled = [...availableCharacters].sort(() => 0.5 - Math.random());
        
        room.players.forEach((player: any, index: number) => {
          room.assignments[player.id] = shuffled[index % shuffled.length];
        });

        io.to(data.roomId).emit("gameStarted", room);
      }
    });

    socket.on("restartGame", (data) => {
      const room = rooms.get(data.roomId);
      if (room && room.host === socket.id) {
        room.status = "playing";
        const availableCharacters = room.board.slots.filter((s: any) => s.image);
        const shuffled = [...availableCharacters].sort(() => 0.5 - Math.random());
        
        room.players.forEach((player: any, index: number) => {
          room.assignments[player.id] = shuffled[index % shuffled.length];
        });

        io.to(data.roomId).emit("gameStarted", room);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex((p: any) => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            if (room.host === socket.id) {
              room.host = room.players[0].id;
              room.players[0].isHost = true;
            }
            io.to(roomId).emit("roomUpdated", room);
          }
        }
      });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0" as any, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
