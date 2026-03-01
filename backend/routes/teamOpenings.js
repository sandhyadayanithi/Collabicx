import express from 'express';
import admin, { db } from '../firebase.js';

const router = express.Router();

// Middleware to verify Firebase ID Token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

router.use(verifyToken);

// Create Team Opening
router.post('/', async (req, res) => {
  console.log("POST /api/team-openings - Start", { userId: req.user?.uid, body: req.body });
  try {
    const { teamId, description, requiredRoles, visibility, slotsOpen } = req.body;
    const userId = req.user.uid;

    // Fetch user profile to check profession
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userSnap.data();

    let finalVisibility = visibility || 'public';
    let finalCollegeDomain = null;

    if (userData.profession === 'Other') {
      finalVisibility = 'public';
    } else if (userData.profession === 'Student') {
      if (!['my-college', 'all-colleges', 'public'].includes(finalVisibility)) {
        finalVisibility = 'public';
      }
      if (finalVisibility === 'my-college') {
        finalCollegeDomain = userData.collegeDomain || null;
      }
    }

    const teamSnap = await db.collection('teams').doc(teamId).get();
    if (!teamSnap.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const payload = {
      teamId,
      teamName: teamSnap.data().name || 'Unnamed Team',
      createdBy: userId,
      description: description || '',
      requiredRoles: requiredRoles || [],
      visibility: finalVisibility,
      collegeDomain: finalCollegeDomain,
      slotsOpen: Number.isFinite(slotsOpen) ? slotsOpen : 1,
      status: "OPEN",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('teamOpenings').add(payload);

    // Log Activity (Legacy support - can be done via Firestore directly if needed)
    await db.collection('activities').add({
      teamId,
      userId,
      type: 'create_team_opening',
      content: { teamName: payload.teamName },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ id: docRef.id, ...payload });
  } catch (error) {
    console.error("Error creating team opening:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch Team Openings with Filtering
router.get('/', async (req, res) => {
  console.log("GET /api/team-openings - Start", { userId: req.user?.uid });
  try {
    const userId = req.user.uid;
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) {
      console.warn(`User profile not found in Firestore for UID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userSnap.data();

    console.log("Fetching teamOpenings from Firestore...");
    let query = db.collection('teamOpenings').where('status', '==', 'OPEN');
    const snapshot = await query.get();
    console.log(`Found ${snapshot.size} total active openings.`);

    let openings = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      let isVisible = false;

      if (data.visibility === 'public') {
        isVisible = true;
      } else if (userData.profession === 'Student') {
        if (data.visibility === 'all-colleges') {
          isVisible = true;
        } else if (data.visibility === 'my-college' && data.collegeDomain === userData.collegeDomain) {
          isVisible = true;
        }
      }

      if (isVisible) {
        openings.push({ id: doc.id, ...data });
      }
    });

    // Sort in-memory to avoid requiring a composite index
    openings.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?._seconds * 1000 || 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?._seconds * 1000 || 0);
      return timeB - timeA;
    });

    res.json(openings);
  } catch (error) {
    console.error("Error fetching team openings:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
