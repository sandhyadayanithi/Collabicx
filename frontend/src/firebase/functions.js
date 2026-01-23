import {
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    getAdditionalUserInfo,
    deleteUser
} from "firebase/auth";
import {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    serverTimestamp,
    onSnapshot,
    orderBy,
    deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, googleProvider, githubProvider, storage } from "./config";

// --- 0. Helper Functions ---
export const checkUsernameAvailability = async (username) => {
    if (!username) return false;
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
};

export const updateUserProfile = async (userId, data) => {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const uploadProfileImage = async (userId, file) => {
    const storageRef = ref(storage, `users/${userId}/avatar_${Date.now()}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

// --- 1. Authentication Functions ---

export const googleSignIn = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const { isNewUser } = getAdditionalUserInfo(result);
        await createUserProfile(user);
        return { user, isNewUser };
    } catch (error) {
        throw error;
    }
};

export const githubSignIn = async () => {
    try {
        const result = await signInWithPopup(auth, githubProvider);
        const user = result.user;
        const { isNewUser } = getAdditionalUserInfo(result);
        await createUserProfile(user);
        return { user, isNewUser };
    } catch (error) {
        throw error;
    }
};

export const signUpWithEmail = async (email, password, name) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        await createUserProfile(user, { name });
        return user;
    } catch (error) {
        throw error;
    }
};

export const loginWithEmail = async (email, password) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        throw error;
    }
};

export const logout = () => signOut(auth);

export const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
};

const createUserProfile = async (user, additionalData = {}) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            name: additionalData.name || user.displayName || "New User",
            email: user.email,
            avatar: user.photoURL || "",
            createdAt: serverTimestamp(),
            ...additionalData
        });
    }
};

export const deleteUserAccount = async (userId) => {
    // 1. Remove user from all teams
    const teams = await getUserTeams(userId);
    for (const team of teams) {
        const membersRef = collection(db, `teams/${team.id}/members`);
        const q = query(membersRef, where("userId", "==", userId));
        const snap = await getDocs(q);

        const deletePromises = snap.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
    }

    // 2. Delete user profile
    await deleteDoc(doc(db, "users", userId));

    // 3. Delete auth account
    const user = auth.currentUser;
    if (user) {
        await deleteUser(user);
    }
};

// --- 3. Team Functions ---

export const createTeam = async (name, description, userId) => {
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const teamRef = await addDoc(collection(db, "teams"), {
        name,
        description,
        joinCode,
        createdBy: userId,
        createdAt: serverTimestamp()
    });

    // Add creator as member
    await addDoc(collection(db, `teams/${teamRef.id}/members`), {
        userId,
        role: "owner",
        joinedAt: serverTimestamp()
    });

    return { id: teamRef.id, joinCode };
};

export const joinTeamByCode = async (code, userId) => {
    const teamsQuery = query(collection(db, "teams"), where("joinCode", "==", code));
    const querySnapshot = await getDocs(teamsQuery);

    if (querySnapshot.empty) {
        throw new Error("Invalid join code");
    }

    const teamDoc = querySnapshot.docs[0];
    await addDoc(collection(db, `teams/${teamDoc.id}/members`), {
        userId,
        role: "member",
        joinedAt: serverTimestamp()
    });

    return teamDoc.id;
};

export const getUserTeams = async (userId) => {
    // This is a bit tricky with the subcollection structure without collection groups. 
    // Usually, we'd store a list of team IDs on the user doc or use a top-level memberships collection.
    // For simplicity per requested structure:
    const teams = [];
    const teamsSnap = await getDocs(collection(db, "teams"));
    for (const teamDoc of teamsSnap.docs) {
        const memberSnap = await getDocs(query(collection(db, `teams/${teamDoc.id}/members`), where("userId", "==", userId)));
        if (!memberSnap.empty) {
            teams.push({ id: teamDoc.id, ...teamDoc.data() });
        }
    }
    return teams;
};

export const getTeamMembers = async (teamId) => {
    const membersSnap = await getDocs(collection(db, `teams/${teamId}/members`));
    const members = [];
    for (const memberDoc of membersSnap.docs) {
        const userSnap = await getDoc(doc(db, "users", memberDoc.data().userId));
        members.push({ id: memberDoc.id, ...memberDoc.data(), user: userSnap.data() });
    }
    return members;
};

// --- 4. Hackathon Functions ---

export const createHackathon = async (teamId, data) => {
    const hackathonRef = await addDoc(collection(db, `teams/${teamId}/hackathons`), {
        status: "Yet to register",
        ...data,
        createdAt: serverTimestamp()
    });
    return hackathonRef.id;
};

export const getHackathons = async (teamId) => {
    const snap = await getDocs(collection(db, `teams/${teamId}/hackathons`));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getHackathonDetails = async (teamId, hackathonId) => {
    const docRef = doc(db, `teams/${teamId}/hackathons`, hackathonId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
};

export const updateHackathonStatus = async (teamId, hackathonId, status) => {
    const ref = doc(db, `teams/${teamId}/hackathons`, hackathonId);
    await updateDoc(ref, { status });
};

export const updateHackathon = async (teamId, hackathonId, data) => {
    const ref = doc(db, `teams/${teamId}/hackathons`, hackathonId);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    });
};

// --- 5. Notes Functions ---

export const updateQuickNote = async (teamId, hackathonId, content) => {
    const noteRef = doc(db, `teams/${teamId}/hackathons/${hackathonId}/notes`, 'shared');
    await setDoc(noteRef, {
        content,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const listenToQuickNote = (teamId, hackathonId, callback) => {
    const noteRef = doc(db, `teams/${teamId}/hackathons/${hackathonId}/notes`, 'shared');
    return onSnapshot(noteRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data().content);
        } else {
            callback(""); // Default to empty if no note exists
        }
    });
};

export const addNote = async (teamId, hackathonId, content) => {
    await addDoc(collection(db, `teams/${teamId}/hackathons/${hackathonId}/notes`), {
        content,
        createdAt: serverTimestamp()
    });
};

export const getNotes = async (teamId, hackathonId) => {
    const snap = await getDocs(collection(db, `teams/${teamId}/hackathons/${hackathonId}/notes`));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// --- 6. Tasks Functions ---

export const addTask = async (teamId, hackathonId, title, category = "General") => {
    await addDoc(collection(db, `teams/${teamId}/hackathons/${hackathonId}/tasks`), {
        title,
        category,
        completed: false,
        createdAt: serverTimestamp()
    });
};

export const listenToTasks = (teamId, hackathonId, callback) => {
    const q = query(
        collection(db, `teams/${teamId}/hackathons/${hackathonId}/tasks`),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(tasks);
    });
};

export const toggleTaskComplete = async (teamId, hackathonId, taskId) => {
    const ref = doc(db, `teams/${teamId}/hackathons/${hackathonId}/tasks`, taskId);
    const snap = await getDoc(ref);
    await updateDoc(ref, { completed: !snap.data().completed });
};

export const getTasks = async (teamId, hackathonId) => {
    const snap = await getDocs(collection(db, `teams/${teamId}/hackathons/${hackathonId}/tasks`));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// --- 7. Submission Links Functions ---

export const addLink = async (teamId, hackathonId, label, url, type = "link", icon = "link", color = "bg-slate-500") => {
    await addDoc(collection(db, `teams/${teamId}/hackathons/${hackathonId}/links`), {
        label,
        url,
        type,
        icon,
        color,
        createdAt: serverTimestamp()
    });
};

export const listenToLinks = (teamId, hackathonId, callback) => {
    const q = query(
        collection(db, `teams/${teamId}/hackathons/${hackathonId}/links`),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
        const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(links);
    });
};

export const getLinks = async (teamId, hackathonId) => {
    const snap = await getDocs(collection(db, `teams/${teamId}/hackathons/${hackathonId}/links`));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// --- 8. Chat Functions ---

export const sendMessage = async (teamId, hackathonId, userId, message, userName = "Unknown", userAvatar = "") => {
    await addDoc(collection(db, `teams/${teamId}/hackathons/${hackathonId}/messages`), {
        userId,
        message,
        userName,
        userAvatar,
        createdAt: serverTimestamp()
    });
};

export const listenToMessages = (teamId, hackathonId, callback) => {
    const q = query(
        collection(db, `teams/${teamId}/hackathons/${hackathonId}/messages`),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(messages);
    });
};

export const editMessage = async (teamId, hackathonId, messageId, newMessage) => {
    const ref = doc(db, `teams/${teamId}/hackathons/${hackathonId}/messages`, messageId);
    await updateDoc(ref, {
        message: newMessage,
        updatedAt: serverTimestamp(),
        isEdited: true
    });
};
