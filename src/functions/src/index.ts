'use server';

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();


/**
 * Calculates team size and total deposits for the calling user.
 * The function identifies the user via their auth context, finds their referral code,
 * queries for users referred by that code, and calculates the stats.
 *
 * @param {object} data - The data passed to the function (not used).
 * @param {functions.https.CallableContext} context - The context of the function call, contains auth info.
 * @returns {Promise<{teamTotalDeposits: number}>}
 */
export const getTeamStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const userId = context.auth.uid;
  const db = admin.firestore();

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User document not found.");
    }

    const userData = userDoc.data();
    const referralCode = userData?.referralCode;

    if (!referralCode || typeof referralCode !== "string") {
      return { teamTotalDeposits: 0 };
    }

    // This query requires a single-field index on 'referredBy'.
    const snapshot = await db.collection("users").where("referredBy", "==", referralCode).get();

    if (snapshot.empty) {
      return { teamTotalDeposits: 0 };
    }

    let teamTotalDeposits = 0;
    snapshot.forEach((doc) => {
      const referredUserData = doc.data();
      if (referredUserData && typeof referredUserData.totalDeposits === "number") {
        teamTotalDeposits += referredUserData.totalDeposits;
      }
    });

    return {
      teamTotalDeposits: teamTotalDeposits,
    };
  } catch (error: any) {
    console.error("Error fetching team stats for user:", userId, error);
    
    if (error.code === "FAILED_PRECONDITION" && error.message.includes("index")) {
        const errorMessage = `Query failed due to a missing index on the 'referredBy' field. Please create the required index in your Firebase console. Original Message: ${error.message}`;
        console.error(errorMessage);
        throw new functions.https.HttpsError(
            "failed-precondition",
            "A database index is required for this operation. Check the function logs for details.",
            { originalMessage: error.message }
        );
    }

    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred while fetching team stats.",
      { originalError: error.message }
    );
  }
});
