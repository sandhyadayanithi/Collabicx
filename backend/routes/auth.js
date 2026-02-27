import express from 'express';
import admin, { db } from '../firebase.js';

const router = express.Router();

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'aol.com', 'icloud.com', 'mail.com', 'zoho.com', 'yandex.com', 'protonmail.com'
]);

router.post('/verify-role', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Error verifying auth token", error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const { uid, email } = decodedToken;
    const { username, role, avatar, usageRole } = req.body;

    if (!usageRole || (usageRole !== 'student' && usageRole !== 'professional')) {
      return res.status(400).json({ error: 'Invalid usage role' });
    }

    const domain = email.split('@')[1].toLowerCase();

    let verifiedStudent = false;
    let collegeDomain = null;
    let collegeName = null;

    if (usageRole === 'student') {
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
            collegeName = data[0].name;
          }
        }
      } catch (err) {
        console.error("Error fetching college name", err);
      }

      if (!collegeName) {
        // Fallback: capitalize domain prefix
        const prefix = domain.split('.')[0];
        collegeName = prefix.charAt(0).toUpperCase() + prefix.slice(1) + " University";
      }
    }

    const userRef = db.collection('users').doc(uid);
    const updateData = {
      username: username.toLowerCase(),
      role: role || 'Developer',
      avatar: avatar || null,
      usageRole,
      verifiedStudent,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (usageRole === 'student') {
      updateData.collegeDomain = collegeDomain;
      updateData.collegeName = collegeName;
      updateData.college = collegeName; // For backwards compatibility with Profile
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
