import { Server } from "socket.io";
import http from "http";
import express from "express";

import User from "../models/user.model.js";
import Group from "../models/group.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {}; // {userId: socketId}

io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;

    const user = await User.findById(userId).select("-password");
    if (user) {
      socket.broadcast.emit("userJoined", user);
    }

    const groups = await Group.find({ members: userId }, "_id");
    groups.forEach((group) => {
      socket.join(group._id.toString());
    });
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", async () => {
    try {
      delete userSocketMap[userId];

      if (userId) {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { lastSeen });
        io.emit("userLastSeen", { userId, lastSeen });
      }

      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    } catch (error) {
      console.error("Error updating last seen:", error);
    }
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", senderId);
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStopTyping", senderId);
    }
  });

  socket.on("groupTyping", ({ groupId, user }) => {
    socket.to(groupId).emit("groupTyping", user);
  });

  socket.on("groupStopTyping", ({ groupId }) => {
    socket.to(groupId).emit("groupStopTyping");
  });
});

export { io, app, server, userSocketMap };
