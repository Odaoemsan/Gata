
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Callable function to get the size of a user's referral team.
export const getTeamSize = functions.https.onCall(async (data, context) => {
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
    // The field in the document is `referredBy`, which stores the referral code of the referrer.
    const snapshot = await usersRef.where("referredBy", "==", referralCode)
      .get();

    return { size: snapshot.size };
  } catch (error: any) {
    // Check for the specific "FAILED_PRECONDITION" error which indicates a missing index.
    if (error.code === "FAILED_PRECONDITION" && error.message.includes("index")) {
        console.error("Query failed due to a missing index. Please create the required index in your Firebase console. The error message may contain a direct link to do so.", error.message);
        throw new functions.https.HttpsError(
            "failed-precondition",
            "A database index is required for this operation. Check the function logs for a creation link.",
            error.message
        );
    }

    console.error("Error fetching team size:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while fetching the team size."
    );
  }
});
