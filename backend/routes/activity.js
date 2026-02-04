import { Router } from 'express';
import admin from 'firebase-admin';

const router = Router();
const db = admin.firestore();

/**
 * @route GET /api/activities
 * @desc Get recent activities for teams
 */
router.get('/', async (req, res) => {
  try {
    const { teamIds } = req.query;
    if (!teamIds) return res.status(400).json({ error: "Missing teamIds" });

    const ids = teamIds.split(',').map(id => id.trim()).filter(Boolean);
    if (ids.length === 0) return res.status(400).json({ error: "Invalid teamIds" });

    const chunks = [];
    for (let i = 0; i < ids.length; i += 10) {
      chunks.push(ids.slice(i, i + 10));
    }

    const activities = [];
    for (const chunk of chunks) {
      const snapshot = await db
        .collection('activities')
        .where('teamId', 'in', chunk)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      snapshot.forEach(doc => {
        activities.push({ id: doc.id, ...doc.data() });
      });
    }

    activities.sort((a, b) => {
      const aSeconds = a.createdAt?.seconds || 0;
      const bSeconds = b.createdAt?.seconds || 0;
      return bSeconds - aSeconds;
    });

    res.status(200).json({ activities: activities.slice(0, 100) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
