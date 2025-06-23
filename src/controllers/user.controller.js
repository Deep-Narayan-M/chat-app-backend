import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";

export const getRecommendedUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;
    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { _id: { $nin: currentUser.friends } },
        { isOnboarded: true },
      ],
    }).limit(5);

    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "username profilePic bio");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error);
    res.status(500).json({ message: error.message });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id: recipientId } = req.params;
    if (currentUserId.toString() === recipientId) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }
    if (recipient.friends.includes(currentUserId)) {
      return res.status(400).json({ message: "You are already friends" });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: currentUserId, recipient: recipientId },
        { sender: recipientId, recipient: currentUserId },
      ],
    });
    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    const friendRequest = await FriendRequest.create({
      sender: currentUserId,
      recipient: recipientId,
    });
    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error);
    res.status(500).json({ message: error.message });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }
    if (friendRequest.recipient.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not the recipient of this friend request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each other to friends array
    const sender = await User.findById(friendRequest.sender);
    if (!sender.friends.includes(friendRequest.recipient)) {
      sender.friends.push(friendRequest.recipient);
      await sender.save();
    }
    const recipient = await User.findById(friendRequest.recipient);
    if (!recipient.friends.includes(friendRequest.sender)) {
      recipient.friends.push(friendRequest.sender);
      await recipient.save();
    }

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Error in acceptFriendRequest controller", error);
    res.status(500).json({ message: error.message });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const incomingRequests = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "username profilePic");

    const acceptedRequests = await FriendRequest.find({
      recipient: req.user.id,
      status: "accepted",
    }).populate("sender", "username profilePic");

    res.status(200).json({ incomingRequests, acceptedRequests });
  } catch (error) {
    console.error("Error in getFriendRequests controller", error);
    res.status(500).json({ message: error.message });
  }
};

export const getOutgoingFriendRequests = async (req, res) => {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "username profilePic");
    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.error("Error in getOutgoingFriendRequests controller", error);
    res.status(500).json({ message: error.message });
  }
};
