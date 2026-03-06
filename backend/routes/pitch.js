import express from 'express';
import admin from '../firebase.js';
import { analyzePitch, getLastPitch } from '../services/pitchAnalysisService.js';

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
    const { targetId, pitchContent, hackathonIdea } = req.body;
    const userId = req.user.uid;

    if (!pitchContent || !pitchContent.trim()) {
      return res.status(400).json({ error: 'Pitch content is required' });
    }

    const result = await analyzePitch(userId, targetId || 'general', pitchContent, hackathonIdea || null);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in /api/pitch/analyze:", error);
    if (error.message === "INSUFFICIENT_ANALYZE_CREDITS") {
      return res.status(402).json({ error: 'Insufficient credits for analysis' });
    }
    res.status(500).json({ error: 'Internal server error while analyzing pitch' });
  }
});

// Get Last Pitch
router.get('/last', async (req, res) => {
  console.log("GET /api/pitch/last - Start", { userId: req.user?.uid, query: req.query });
  try {
    const { targetId } = req.query;
    const userId = req.user.uid;

    const result = await getLastPitch(userId, targetId || 'general');
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(200).json(null); // Return null 200 explicitly when no pitch found
    }
  } catch (error) {
    console.error("Error in /api/pitch/last:", error);
    res.status(500).json({ error: 'Internal server error while fetching last pitch' });
  }
});

export default router;
