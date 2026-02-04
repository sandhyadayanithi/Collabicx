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
    deleteDoc,
    runTransaction
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

    // Log Activity
    await logActivity(teamRef.id, userId, 'create_team', { teamName: name });

    return { id: teamRef.id, joinCode };
};

export const joinTeamByCode = async (code, userId) => {
    const teamsQuery = query(collection(db, "teams"), where("joinCode", "==", code));
    const querySnapshot = await getDocs(teamsQuery);

    if (querySnapshot.empty) {
        throw new Error("Invalid join code");
    }

    const teamDoc = querySnapshot.docs[0];
    const teamData = teamDoc.data();

    await addDoc(collection(db, `teams/${teamDoc.id}/members`), {
        userId,
        role: "member",
        joinedAt: serverTimestamp()
    });

    // Log Activity
    await logActivity(teamDoc.id, userId, 'join_team', { teamName: teamData.name });

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
            const memberData = memberSnap.docs[0].data();
            teams.push({ id: teamDoc.id, ...teamDoc.data(), role: memberData.role, memberId: memberSnap.docs[0].id });
        }
    }
    return teams;
};

export const getTeamMemberRecord = async (teamId, userId) => {
    const memberSnap = await getDocs(query(collection(db, `teams/${teamId}/members`), where("userId", "==", userId)));
    if (memberSnap.empty) return null;
    return { id: memberSnap.docs[0].id, ...memberSnap.docs[0].data() };
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

    // Log Activity if it's a GitHub repo or significant asset
    if (type === 'github' || type === 'figma') {
        await logActivity(teamId, auth.currentUser?.uid, 'connect_repo', {
            type,
            label,
            url
        });
    }
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

    // Log Activity (briefly)
    await logActivity(teamId, userId, 'send_message', {
        messagePreview: message.substring(0, 50),
        userName
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

// --- 9. Discover: Team Openings & Applications ---

export const createTeamOpening = async (teamId, userId, data) => {
    const member = await getTeamMemberRecord(teamId, userId);
    if (!member || member.role !== 'owner') {
        throw new Error("Only team leads can create openings.");
    }

    const teamSnap = await getDoc(doc(db, "teams", teamId));
    if (!teamSnap.exists()) throw new Error("Team not found.");

    const payload = {
        teamId,
        teamName: teamSnap.data().name || 'Unnamed Team',
        createdBy: userId,
        description: data.description || '',
        requiredRoles: data.requiredRoles || [],
        collegeScope: data.collegeScope || { type: "ALL" },
        slotsOpen: Number.isFinite(data.slotsOpen) ? data.slotsOpen : 1,
        status: data.status || "OPEN",
        createdAt: serverTimestamp()
    };

    const ref = await addDoc(collection(db, "teamOpenings"), payload);

    await logActivity(teamId, userId, 'create_team_opening', {
        teamName: payload.teamName
    });

    return { id: ref.id, ...payload };
};

export const updateTeamOpeningStatus = async (openingId, status) => {
    const ref = doc(db, "teamOpenings", openingId);
    await updateDoc(ref, { status });
};

export const listenToTeamOpenings = (callback) => {
    const q = query(
        collection(db, "teamOpenings"),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
        const openings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(openings);
    });
};

export const listenToTeamOpeningsByLead = (userId, callback) => {
    const q = query(
        collection(db, "teamOpenings"),
        where("createdBy", "==", userId),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
        const openings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(openings);
    });
};

export const applyToTeamOpening = async ({ openingId, applicantId, githubUrl, message, applicantCollege }) => {
    const openingRef = doc(db, "teamOpenings", openingId);
    const openingSnap = await getDoc(openingRef);
    if (!openingSnap.exists()) throw new Error("Opening not found.");

    const opening = openingSnap.data();
    if (opening.status !== "OPEN" || opening.slotsOpen <= 0) {
        throw new Error("This opening is closed.");
    }

    const member = await getTeamMemberRecord(opening.teamId, applicantId);
    if (member) throw new Error("You are already on this team.");

    const existingApplicationSnap = await getDocs(query(
        collection(db, "teamApplications"),
        where("teamOpeningId", "==", openingId),
        where("applicantId", "==", applicantId)
    ));
    if (!existingApplicationSnap.empty) throw new Error("You already applied to this opening.");

    if (opening.collegeScope?.type === "COLLEGE_ONLY") {
        const requiredCollege = opening.collegeScope?.collegeName || "";
        if (!applicantCollege || applicantCollege.trim().toLowerCase() !== requiredCollege.trim().toLowerCase()) {
            throw new Error("This opening is restricted to a specific college.");
        }
    }

    await addDoc(collection(db, "teamApplications"), {
        teamOpeningId: openingId,
        teamId: opening.teamId,
        teamName: opening.teamName,
        applicantId,
        githubUrl,
        message: message || '',
        status: "PENDING",
        createdAt: serverTimestamp()
    });

    await logActivity(opening.teamId, applicantId, 'apply_to_team', {
        teamName: opening.teamName
    });
};

export const withdrawApplication = async (applicationId, applicantId) => {
    const appRef = doc(db, "teamApplications", applicationId);
    const appSnap = await getDoc(appRef);
    if (!appSnap.exists()) throw new Error("Application not found.");
    if (appSnap.data().applicantId !== applicantId) throw new Error("Not allowed.");
    await updateDoc(appRef, { status: "WITHDRAWN", reviewedAt: serverTimestamp() });
};

export const listenToMyApplications = (applicantId, callback) => {
    const q = query(
        collection(db, "teamApplications"),
        where("applicantId", "==", applicantId),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
        const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(apps);
    });
};

export const listenToApplicationsByOpeningIds = (openingIds, callback) => {
    if (!openingIds || openingIds.length === 0) {
        callback([]);
        return () => { };
    }

    const chunks = [];
    for (let i = 0; i < openingIds.length; i += 10) {
        chunks.push(openingIds.slice(i, i + 10));
    }

    const resultsByChunk = new Map();
    const emitMerged = () => {
        const merged = Array.from(resultsByChunk.values()).flat();
        const unique = Array.from(new Map(merged.map(app => [app.id, app])).values());
        callback(unique.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    };

    const unsubscribes = chunks.map((chunk, index) => {
        const q = query(
            collection(db, "teamApplications"),
            where("teamOpeningId", "in", chunk),
            orderBy("createdAt", "desc")
        );
        return onSnapshot(q, (snapshot) => {
            const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            resultsByChunk.set(index, apps);
            emitMerged();
        });
    });

    return () => unsubscribes.forEach(unsub => unsub());
};

export const reviewTeamApplication = async ({ applicationId, reviewerId, decision }) => {
    const appRef = doc(db, "teamApplications", applicationId);
    const appSnap = await getDoc(appRef);
    if (!appSnap.exists()) throw new Error("Application not found.");

    const application = appSnap.data();
    const member = await getTeamMemberRecord(application.teamId, reviewerId);
    if (!member || member.role !== 'owner') {
        throw new Error("Only team leads can review applications.");
    }

    if (decision === "REJECT") {
        await updateDoc(appRef, { status: "REJECTED", reviewedAt: serverTimestamp() });
        return;
    }

    if (decision === "APPROVE") {
        const existingMemberSnap = await getDocs(query(
            collection(db, `teams/${application.teamId}/members`),
            where("userId", "==", application.applicantId)
        ));

        await runTransaction(db, async (transaction) => {
            const openingRef = doc(db, "teamOpenings", application.teamOpeningId);
            const openingSnap = await transaction.get(openingRef);
            if (!openingSnap.exists()) throw new Error("Opening not found.");

            const opening = openingSnap.data();
            if (opening.status !== "OPEN" || opening.slotsOpen <= 0) {
                throw new Error("Opening is closed.");
            }

            if (existingMemberSnap.empty) {
                const memberRef = doc(collection(db, `teams/${application.teamId}/members`));
                transaction.set(memberRef, {
                    userId: application.applicantId,
                    role: "member",
                    joinedAt: serverTimestamp()
                });
            }

            const nextSlots = Math.max(0, (opening.slotsOpen || 0) - 1);
            transaction.update(openingRef, {
                slotsOpen: nextSlots,
                status: nextSlots === 0 ? "CLOSED" : opening.status
            });

            transaction.update(appRef, { status: "APPROVED", reviewedAt: serverTimestamp() });
        });

        await logActivity(application.teamId, application.applicantId, 'join_team', {
            teamName: application.teamName,
            source: 'discover'
        });
    }
};

// --- 10. Activity Functions ---

export const logActivity = async (teamId, userId, type, metadata = {}) => {
    try {
        await addDoc(collection(db, "activities"), {
            teamId,
            userId,
            type,
            metadata,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};

// Optional helper for future secret sharing flows (not auto-used yet)
export const logShareSecret = async (teamId, userId, secretName, maskedValue) => {
    return logActivity(teamId, userId, 'share_secret', {
        secretName,
        maskedValue
    });
};

export const listenToActivities = (teamIds, callback) => {
    if (!teamIds || teamIds.length === 0) {
        callback([]);
        return () => { };
    }

    // Firestore has a limit of 10 items in an 'in' query
    const chunks = [];
    for (let i = 0; i < teamIds.length; i += 10) {
        chunks.push(teamIds.slice(i, i + 10));
    }

    const unsubscribes = chunks.map(chunk => {
        const q = query(
            collection(db, "activities"),
            where("teamId", "in", chunk),
            orderBy("createdAt", "desc")
        );
        return onSnapshot(q, (snapshot) => {
            const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(activities); // Note: This will only provide activities for this specific chunk
            // In a real app, you'd merge these results. For simplicity here, we assume user has < 10 teams.
        });
    });

    return () => unsubscribes.forEach(unsub => unsub());
};

export const fetchAllActivities = async (teamIds) => {
    if (!teamIds || teamIds.length === 0) return [];

    const activities = [];
    // Handle chunks of 10 for 'in' query
    for (let i = 0; i < teamIds.length; i += 10) {
        const chunk = teamIds.slice(i, i + 10);
        const q = query(
            collection(db, "activities"),
            where("teamId", "in", chunk),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        activities.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    return activities.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
};
