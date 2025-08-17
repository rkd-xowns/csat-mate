// functions/src/index.ts

import { onSchedule, ScheduledEvent } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const cleanupInactiveUsers = onSchedule({
  schedule: "0 3 * * *",
  timeZone: "Asia/Seoul",
  region: "asia-northeast3",
}, async (event: ScheduledEvent) => {
  logger.log("Starting inactive and unverified users cleanup job.");

  const unverifiedThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const guestInactiveThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let uidsToDelete: string[] = [];
  let pageToken;

  try {
    do {
      const listUsersResult = await admin.auth().listUsers(1000, pageToken);
      
      listUsersResult.users.forEach((user) => {
        const creationTime = new Date(user.metadata.creationTime);
        const lastSignInTime = new Date(user.metadata.lastSignInTime);
        
        const isOldUnverifiedUser = user.email && !user.emailVerified && creationTime < unverifiedThreshold;
        const isInactiveGuest = !user.email && lastSignInTime < guestInactiveThreshold;

        if (isOldUnverifiedUser || isInactiveGuest) {
          uidsToDelete.push(user.uid);
          const reason = isOldUnverifiedUser ? "Unverified Email" : "Inactive Guest";
          logger.log(`Marking user for deletion: ${user.uid}, Reason: ${reason}`);
        }
      });

      pageToken = listUsersResult.pageToken;

    } while (pageToken);

    if (uidsToDelete.length > 0) {
      const result = await admin.auth().deleteUsers(uidsToDelete);
      logger.log(`Successfully deleted ${result.successCount} users.`);
      
      // [수정] error 객체에서 index를 사용해 실패한 uid를 찾습니다.
      result.errors.forEach((error) => {
        const failedUid = uidsToDelete[error.index];
        logger.error(
          `Failed to delete user: ${failedUid}, Reason: ${error.error}`
        );
      });
    } else {
      logger.log("No inactive or unverified users to delete.");
    }

  } catch (error) {
    logger.error("Error during user cleanup:", error);
  }
});