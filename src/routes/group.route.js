import express from "express";
import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import auth from "../middleware/auth.middleware.js";

import { io, userSocketMap } from "../lib/socket.js";

const router = express.Router();

// Create a new group chat
router.post("/", auth, async (req, res) => {
  try {
    const { name, userIds } = req.body;

    if (!name || !Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ error: "Group name and at least one user are required." });
    }

    const MAX_GROUP_SIZE = 10;
    const finalUserIds = [...new Set([...userIds, req.user._id.toString()])];

    if (finalUserIds.length > MAX_GROUP_SIZE) {
      return res
        .status(400)
        .json({ error: `Group size cannot exceed ${MAX_GROUP_SIZE} users.` });
    }

    // Fetch user objects with blockedUsers lists
    const users = await User.find(
      { _id: { $in: finalUserIds } },
      "_id blockedUsers"
    );

    // Build map of userId => Set(blockedUsers)
    const blockMap = new Map();
    users.forEach((user) => {
      blockMap.set(
        user._id.toString(),
        new Set(user.blockedUsers.map((id) => id.toString()))
      );
    });

    // Check for any blocked relationships
    for (let i = 0; i < finalUserIds.length; i++) {
      for (let j = i + 1; j < finalUserIds.length; j++) {
        const a = finalUserIds[i];
        const b = finalUserIds[j];
        if (blockMap.get(a)?.has(b) || blockMap.get(b)?.has(a)) {
          return res.status(400).json({
            error: `Group cannot be created. A block exists between users: ${a} and ${b}`,
          });
        }
      }
    }

    const group = await Group.create({
      name,
      members: finalUserIds,
    });

    const populatedGroup = await group.populate(
      "members",
      "fullName profilePic"
    );

    finalUserIds.forEach((memberId) => {
      const socketId = userSocketMap[memberId];
      if (socketId) {
        io.to(socketId).emit("groupCreated", populatedGroup);
      }
    });

    res.status(201).json(populatedGroup);
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ error: "Server error while creating group" });
  }
});

router.post("/:groupId/send", auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, image } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const newMessage = await Message.create({
      senderId: req.user._id,
      text,
      image,
      groupId,
    });

    // Emit message to all group members (except sender)
    io.to(groupId).emit("newMessage", {
      _id: newMessage._id,
      text: newMessage.text,
      image: newMessage.image,
      senderId: newMessage.senderId,
      createdAt: newMessage.createdAt,
      groupId,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Failed to send group message:", error);
    res.status(500).json({ message: "Server error while sending message" });
  }
});

router.get("/:groupId/messages", auth, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Ensure the user is part of the group
    const isMember = group.members.includes(req.user._id);
    if (!isMember) {
      return res.status(403).json({ message: "Access denied: not in group" });
    }

    const messages = await Message.find({ groupId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ message: "Server error fetching group messages" });
  }
});

// Get all group chats the user is in
router.get("/", auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).populate(
      "members",
      "fullName profilePic"
    );
    res.json(groups);
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ error: "Server error fetching groups" });
  }
});

router.patch("/:groupId/add-members", auth, async (req, res) => {
  const { groupId } = req.params;
  const { userIds } = req.body;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  const existingIds = group.members.map((id) => id.toString());
  const newIds = userIds.filter((id) => !existingIds.includes(id));

  group.members.push(...newIds);
  await group.save();

  res.status(200).json(group);
});

export default router;
