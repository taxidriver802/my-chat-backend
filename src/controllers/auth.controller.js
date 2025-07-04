import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

import { generateToken } from "../lib/utils.js";
import { axiosInstance } from "../../../my-chat-frontend/src/lib/axios.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });

      io.emit("newUser", { _id: newUser._id, username: newUser.username });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });

    const unreadCounts = await axiosInstance.get("/messages/unread-counts");
    useChatStore.getState().setUnreadCounts(unreadCounts.data);
  } catch (error) {
    console.log("Error in login controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;
    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePic: uploadResponse.secure_url,
      },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in updateProfile controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    const userIdToBlock = req.params.userId;
    if (!userIdToBlock || userIdToBlock === req.user._id.toString()) {
      return res.status(400).json({ error: "Invalid user to block." });
    }

    if (!currentUser.blockedUsers.includes(userIdToBlock)) {
      currentUser.blockedUsers.push(userIdToBlock);
      await currentUser.save();
    }

    res.status(200).json({ message: "User blocked successfully." });
  } catch (err) {
    console.error("Block error:", err);
    res.status(500).json({ error: "Server error while blocking user." });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const userIdToUnblock = req.params.userId;

    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (id) => id.toString() !== userIdToUnblock
    );

    await currentUser.save();
    res.status(200).json({ message: "User unblocked successfully." });
  } catch (err) {
    console.error("Unblock error:", err);
    res.status(500).json({ error: "Server error while unblocking user." });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate(
      "blockedUsers",
      "fullName email profilePic"
    );

    res.status(200).json({ blocked: currentUser.blockedUsers });
  } catch (err) {
    console.error("Fetch blocked users error:", err);
    res.status(500).json({ error: "Error fetching blocked users." });
  }
};
