'use server';

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Calculates the total number of referred users and their total deposits
 * based on the calling user's referral code.
 *
 * @param {object} data - The data passed to the function (not used).
 * @param {functions.https.CallableContext} context - The context of the function call, contains auth info.
 * @returns {Promise<{teamSize: number, teamTotalDeposits: number}>} - The total number of referred users and their total deposits.
 */
export const getTeamStats = functions.https.onCall(async (data, context) => {
  // 1. Check if the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const userId = context.auth.uid;
  const db = admin.firestore();

  try {
    // 2. Get the calling user's document to find their referral code.
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User document not found.");
    }

    const userData = userDoc.data();
    const referralCode = userData?.referralCode;

    if (!referralCode || typeof referralCode !== "string") {
      // User might not have a referral code, which is a valid state.
      return { teamSize: 0, teamTotalDeposits: 0 };
    }

    // 3. Query for users who were referred by this code.
    // This query requires a single-field index on 'referredBy'.
    const snapshot = await db.collection("users").where("referredBy", "==", referralCode).get();

    if (snapshot.empty) {
      return { teamSize: 0, teamTotalDeposits: 0 };
    }

    // 4. Calculate stats.
    let teamTotalDeposits = 0;
    snapshot.forEach((doc) => {
      const referredUserData = doc.data();
      if (referredUserData && typeof referredUserData.totalDeposits === "number") {
        teamTotalDeposits += referredUserData.totalDeposits;
      }
    });

    return {
      teamSize: snapshot.size,
      teamTotalDeposits: teamTotalDeposits,
    };
  } catch (error: any) {
    console.error("Error fetching team stats for user:", userId, error);
    
    // Provide a more specific error for the client if an index is missing.
    if (error.code === "FAILED_PRECONDITION" && error.message.includes("index")) {
        const errorMessage = `Query failed due to a missing index on the 'referredBy' field. Please create the required index in your Firebase console. Original Message: ${error.message}`;
        console.error(errorMessage);
        throw new functions.https.HttpsError(
            "failed-precondition",
            "A database index is required for this operation. Check the function logs for details.",
            { originalMessage: error.message }
        );
    }

    // For all other errors, throw a generic internal error.
    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred while fetching team stats.",
      { originalError: error.message }
    );
  }
});
