import { onSchedule } from "firebase-functions/v2/scheduler"; // v2 스케줄러 import
import * as admin from "firebase-admin";
import { logger } from "firebase-functions"; // v2 로거 import

admin.initializeApp();

// 최신 v2 문법인 onSchedule을 사용합니다.
export const cleanupGuestAccounts = onSchedule("every day 03:00", async (event) => {
    const INACTIVE_THRESHOLD_DAYS = 30;
    const now = new Date();
    const inactiveDate = new Date(now.setDate(now.getDate() - INACTIVE_THRESHOLD_DAYS));
    
    logger.info(`Searching for inactive guest accounts created before ${inactiveDate.toISOString()}...`);

    try {
      const listUsersResult = await admin.auth().listUsers(1000);
      
      const usersToDelete: string[] = [];
      
      listUsersResult.users.forEach((user) => {
        // 사용자가 익명(게스트) 계정인지 확인합니다.
        if (user.providerData.length === 0) {
          const creationTime = new Date(user.metadata.creationTime);
          
          if (creationTime < inactiveDate) {
            usersToDelete.push(user.uid);
          }
        }
      });

      if (usersToDelete.length > 0) {
        const result = await admin.auth().deleteUsers(usersToDelete);
        logger.info(`Successfully deleted ${result.successCount} inactive guest users.`);
        logger.warn(`Failed to delete ${result.failureCount} users.`);
        result.errors.forEach((err) => {
          logger.error("Deletion error:", err.error.toJSON());
        });
      } else {
        logger.info("No inactive guest accounts to delete.");
      }
      
    } catch (error) {
      logger.error("Error cleaning up guest accounts:", error);
    }
  });
