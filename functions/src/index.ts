
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Calculates the total number of referred users and their total deposits.
 *
 * @param {object} data - The data passed to the function.
 * @param {string} data.referralCode - The referral code of the user.
 * @param {functions.https.CallableContext} context - The context of the function call.
 * @returns {Promise<{teamSize: number, teamTotalDeposits: number}>} - The total number of referred users and their total deposits.
 */
export const getTeamStats = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const referralCode = data.referralCode;
  if (!referralCode || typeof referralCode !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a valid 'referralCode'."
    );
  }

  try {
    const db = admin.firestore();
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("referredBy", "==", referralCode).get();

    if (snapshot.empty) {
      return { teamSize: 0, teamTotalDeposits: 0 };
    }

    let teamTotalDeposits = 0;
    snapshot.forEach((doc) => {
      const userData = doc.data();
      // Ensure totalDeposits is a number before adding
      if (userData && typeof userData.totalDeposits === "number") {
        teamTotalDeposits += userData.totalDeposits;
      }
    });

    return {
      teamSize: snapshot.size,
      teamTotalDeposits: teamTotalDeposits,
    };
  } catch (error: any) {
    // Check for the specific "FAILED_PRECONDITION" error which indicates a missing index.
    if (error.code === "FAILED_PRECONDITION" && error.message.includes("index")) {
        console.error("Query failed due to a missing index. Please create the required index in your Firebase console. The error message may contain a direct link to do so.", error.message);
        // Throw a specific error that the client can understand.
        throw new functions.https.HttpsError(
            "failed-precondition",
            "A database index is required for this operation. Check the function logs for a creation link.",
            error.message
        );
    }

    console.error("Error fetching team stats:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while fetching the team stats."
    );
  }
});
