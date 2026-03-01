import admin from 'firebase-admin';

import serviceAccount from './config/serviceAccountKey.json' with { type: 'json' };

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
    console.log("Firebase Admin initialized for project:", admin.app().options.projectId || serviceAccount.project_id);
}

export const db = admin.firestore();
export default admin;
