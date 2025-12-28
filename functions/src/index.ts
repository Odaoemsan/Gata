
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * Ensures username uniqueness by creating a separate lookup document.
 * This prevents race conditions and allows for secure client-side checks.
 */
export const onUserCreate = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const username = userData.username;
    const userId = context.params.userId;

    if (!username) {
      console.log("User document created without a username:", userId);
      return;
    }

    const usernameRef = db.collection("users_by_username").doc(username);

    try {
      // Use a transaction to ensure atomicity
      await db.runTransaction(async (transaction) => {
        const usernameDoc = await transaction.get(usernameRef);
        if (usernameDoc.exists) {
          // This case should be rare if client-side checks are in place,
          // but it handles race conditions.
          console.error(
            `Username "${username}" already exists. Deleting new user.`,
          );
          // We can't directly delete the user auth record from here
          // without more complex logic. A better approach for production
          // would be to flag the user account for review or deletion.
          // For now, we will delete the Firestore document.
          await snap.ref.delete();
          throw new Error(`Username ${username} is already taken.`);
        } else {
          // Create the username lookup document
          transaction.set(usernameRef, {userId: userId});
        }
      });
      console.log(`Username lookup created for: ${username}`);
    } catch (error) {
      console.error("Transaction failed for username creation:", error);
    }
  });

/**
 * Cleans up the username lookup document when a user document is deleted.
 */
export const onUserDelete = functions.firestore
  .document("users/{userId}")
  .onDelete(async (snap) => {
    const userData = snap.data();
    const username = userData.username;

    if (!username) {
      console.log("User document deleted without a username.");
      return;
    }

    const usernameRef = db.collection("users_by_username").doc(username);

    try {
      await usernameRef.delete();
      console.log(`Username lookup deleted for: ${username}`);
    } catch (error) {
      console.error("Error deleting username lookup:", error);
    }
  });

