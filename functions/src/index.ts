
import * as logger from "firebase-functions/logger";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Sets a custom claim on a user to mark them as an admin.
 * This function can only be called by an existing admin.
 */
export const setAdminClaim = onCall(async (request) => {
  // 1. Check if the caller is an admin.
  if (request.auth?.token.admin !== true) {
    logger.error(
      "Request to set admin claim by non-admin user",
      {uid: request.auth?.uid},
    );
    throw new HttpsError(
      "permission-denied",
      "You must be an admin to perform this action.",
    );
  }

  // 2. Get the target user's UID and the claim to set from the request data.
  const {uid, admin} = request.data;
  if (typeof uid !== "string" || typeof admin !== "boolean") {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a 'uid' (string) and 'admin' (boolean) argument.",
    );
  }

  try {
    // 3. Set the custom claim on the target user.
    await admin.auth().setCustomUserClaims(uid, {admin});
    logger.info(
      `Admin claim set for user ${uid} to ${admin} by ${request.auth?.uid}`,
    );
    return {
      message: `Success! User ${uid} has been ${
        admin ? "made" : "removed as"
      } an admin.`,
    };
  } catch (error) {
    logger.error("Error setting custom user claims", error);
    throw new HttpsError(
      "internal",
      "An internal error occurred while setting the admin claim.",
    );
  }
});

/**
 * Lists users and their custom claims.
 * This can be useful for an admin panel to see who has admin privileges.
 * This function can only be called by an admin.
 */
export const listUsers = onCall(async (request) => {
  // Check if the caller is an admin.
  if (request.auth?.token.admin !== true) {
    logger.error("Request to list users by non-admin user", {
      uid: request.auth?.uid,
    });
    throw new HttpsError(
      "permission-denied",
      "You must be an admin to perform this action.",
    );
  }

  const {uids} = request.data;

  try {
    const userRecords = await Promise.all(
      uids.map((uid: string) => admin.auth().getUser(uid)),
    );
    const users = userRecords.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      customClaims: userRecord.customClaims,
    }));

    return {users};
  } catch (error) {
    logger.error("Error listing users:", error);
    throw new HttpsError("internal", "Unable to list users.");
  }
});
