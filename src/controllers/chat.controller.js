import { generateStreamToken } from "../lib/stream.js";

const getChatToken = async (req, res) => {
  try {
    console.log("Generating token for user:", req.user._id);
    const chatToken = generateStreamToken(req.user._id);
    console.log("Generated chat token:", chatToken);
    res.status(200).json({ chatToken });
  } catch (error) {
    console.error("Error in getChatToken controller", error);
    res.status(500).json({ message: error.message });
  }
};

export default getChatToken;
