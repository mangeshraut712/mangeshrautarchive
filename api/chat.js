// filepath: /Users/mangeshraut/mangeshrautarchive/api/chat.js
// (This is a Node.js/Express example, not for direct browser use)
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  const { message } = req.body;
  const profileContext = `...your profile context here...`;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent([profileContext, message]);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (e) {
    res.status(500).json({ reply: "Sorry, there was an error connecting to the AI." });
  }
});

export default router;