import { generateStreamToken } from "../lib/stream.js";

const getChatToken = async (req, res) => {
  try {
    const chatToken = generateStreamToken(req.user.id);
    res.status(200).json({ chatToken });
  } catch (error) {
    console.error("Error in getChatToken controller", error);
    res.status(500).json({ message: error.message });
  }
};

export default getChatToken;
