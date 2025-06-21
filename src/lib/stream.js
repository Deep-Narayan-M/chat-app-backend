import { StreamChat } from "stream-chat";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("STREAM_API_KEY and STREAM_API_SECRET is missing");
  process.exit(1);
}

const chatClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
  try {
    await chatClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.error("Error upserting stream user", error);
  }
};

export const generateStreamToken = (userId) => {
  try {
    // ensure userId is a string
    const userIdStr = userId.toString();
    const token = chatClient.createToken(userIdStr);
    return token;
  } catch (error) {
    console.error("Error generating stream token", error);
  }
};
