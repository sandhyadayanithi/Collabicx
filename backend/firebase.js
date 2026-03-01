import admin from 'firebase-admin';

import serviceAccount from './config/serviceAccountKey.json' with { type: 'json' };

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized for project:", admin.app().options.projectId);
}

export const db = admin.firestore();
export default admin;
