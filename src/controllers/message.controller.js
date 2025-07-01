import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user._id;
    let messages;

    await Message.updateMany(
      {
        senderId: id,
        receiverId: myId,
        read: false,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    );

    if (req.query.type === "group") {
      messages = await Message.find({ groupId: id });
    } else {
      messages = await Message.find({
        $or: [
          { senderId: myId, receiverId: id },
          { senderId: id, receiverId: myId },
        ],
      });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUnreadMessageCounts = async (req, res) => {
  try {
    const myId = req.user._id;

    const unreadMessages = await Message.aggregate([
      { $match: { receiverId: myId, read: false } },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
        },
      },
    ]);

    const countsMap = {};
    unreadMessages.forEach(({ _id, count }) => {
      countsMap[_id] = count;
    });

    res.status(200).json(countsMap);
  } catch (error) {
    console.log("Error in getUnreadCounts:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, groupId } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const [senderUser, receiverUser] = await Promise.all([
      User.findById(senderId, "blockedUsers"),
      User.findById(receiverId, "blockedUsers"),
    ]);

    if (!receiverUser) {
      return res.status(404).json({ error: "Receiver not found." });
    }

    if (
      senderUser?.blockedUsers?.includes(receiverId) ||
      receiverUser?.blockedUsers?.includes(senderId.toString())
    ) {
      return res
        .status(403)
        .json({ error: "Messaging not allowed between blocked users." });
    }

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId: senderId.toString(),
      receiverId: groupId ? null : receiverId.toString(),
      groupId: groupId || null,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    if (!groupId) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
