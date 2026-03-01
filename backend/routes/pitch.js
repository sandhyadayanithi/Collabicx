import express from 'express';
import admin from '../firebase.js';
import { analyzePitch } from '../services/pitchAnalysisService.js';

const router = express.Router();

// Middleware to verify Firebase ID Token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

router.use(verifyToken);

// Analyze Pitch
router.post('/analyze', async (req, res) => {
  console.log("POST /api/pitch/analyze - Start", { userId: req.user?.uid, body: req.body });
  try {
    const { targetId, pitchContent } = req.body;
    const userId = req.user.uid;

    if (!pitchContent || !pitchContent.trim()) {
      return res.status(400).json({ error: 'Pitch content is required' });
    }

    const result = await analyzePitch(userId, targetId || 'general', pitchContent);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in /api/pitch/analyze:", error);
    if (error.message === "INSUFFICIENT_ANALYZE_CREDITS") {
      return res.status(402).json({ error: 'Insufficient credits for analysis' });
    }
    res.status(500).json({ error: 'Internal server error while analyzing pitch' });
  }
});

export default router;
