import express from 'express';
import admin, { db } from '../firebase.js';

const router = express.Router();

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'aol.com', 'icloud.com', 'mail.com', 'zoho.com', 'yandex.com', 'protonmail.com'
]);

router.post('/verify-role', async (req, res) => {
  console.log("Received /verify-role request:", {
    headers: req.headers,
    body: req.body
  });
  try {
    const authHeader = req.headers.authorization;

    // Defensive logging
    console.log("--- Verify Role Debug ---");
    console.log("Auth Header Exists:", !!authHeader);
    if (authHeader) {
      console.log("Auth Header Length:", authHeader.length);
      const tokenParts = authHeader.split('Bearer ');
      if (tokenParts.length > 1) {
        console.log("Token Length:", tokenParts[1].length);
      }
    }
    console.log("Firebase Project ID:", admin.app().options.projectId || process.env.FIREBASE_PROJECT_ID || 'Unknown');
    console.log("-------------------------");

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Error verifying auth token:", error);
      return res.status(401).json({
        error: 'Unauthorized: Invalid token',
        details: error.message,
        code: error.code
      });
    }

    const { uid, email } = decodedToken;
    const { username, role, avatar, profession } = req.body;

    if (!profession || (profession !== 'Student' && profession !== 'Other')) {
      return res.status(400).json({ error: 'Invalid profession' });
    }

    const domain = email.split('@')[1].toLowerCase();

    let verifiedStudent = false;
    let collegeDomain = null;
    let college = null;

    if (profession === 'Student') {
      if (PERSONAL_DOMAINS.has(domain)) {
        return res.status(400).json({ error: 'Student accounts require a valid college-issued email address.' });
      }

      verifiedStudent = true;
      collegeDomain = domain;

      // Try to fetch college name from universities API
      try {
        const response = await fetch(`http://universities.hipolabs.com/search?domain=${domain}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            college = data[0].name;
          }
        }
      } catch (err) {
        console.error("Error fetching college name", err);
      }

      if (!college) {
        // Fallback: capitalize domain prefix
        const prefix = domain.split('.')[0];
        college = prefix.charAt(0).toUpperCase() + prefix.slice(1) + " University";
      }
    }

    const userRef = db.collection('users').doc(uid);
    const updateData = {
      username: username.toLowerCase(),
      role: role || 'Developer',
      avatar: avatar || null,
      profession,
      verifiedStudent,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (profession === 'Student') {
      updateData.collegeDomain = collegeDomain;
      updateData.college = college;
    }

    await userRef.set(updateData, { merge: true });

    return res.status(200).json({
      success: true,
      user: updateData
    });

  } catch (error) {
    console.error('Error in /verify-role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
