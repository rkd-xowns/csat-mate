import { useState, useEffect, useRef, useCallback } from 'react';
// [추가] Firebase Messaging을 위한 import
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { auth, db } from '../firebaseConfig'; // Firebase 설정 파일
import { doc, setDoc } from 'firebase/firestore';

// 이 훅은 PWA의 핵심 네이티브 기능들을 쉽게 사용할 수 있도록 래핑합니다.
export const usePwaFeatures = () => {
  const [isNotificationSupported, setNotificationSupported] = useState(false);
  const [isVibrationSupported, setVibrationSupported] = useState(false);
  const [isWakeLockSupported, setWakeLockSupported] = useState(false);
  const [isCameraSupported, setCameraSupported] = useState(false);

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setNotificationSupported('Notification' in window);
    setVibrationSupported('vibrate' in navigator);
    setWakeLockSupported('wakeLock' in navigator);
    setCameraSupported('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices);
  }, []);

  // --- 1. 알림 기능 (Firebase Cloud Messaging 연동) ---
  const initializeFirebaseMessaging = useCallback(async () => {
    if (!isNotificationSupported) {
      console.log("알림이 지원되지 않는 브라우저입니다.");
      return;
    }
    
    try {
      const messaging = getMessaging();
      // FCM 등록 토큰 요청 (VAPID 키는 Firebase 설정에서 가져옵니다)
      const vapidKey ="BK8Qb-TG5HEHsUwGcF9UVDWRspbQdnmE2P3phBb5WaaFEH93kh0IyJdtc1PCRHW3wklf05tR0qngSKMgxBgR1Ts"; // Firebase 콘솔에서 발급받은 VAPID 키를 여기에 넣으세요.
      const currentToken = await getToken(messaging, { vapidKey: vapidKey });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // [중요] 이 토큰을 서버에 저장해야 해당 유저에게 푸시 알림을 보낼 수 있습니다.
        // 예: 현재 로그인된 유저의 Firestore 문서에 토큰 저장
        if (auth.currentUser) {
          const userTokenRef = doc(db, "fcmTokens", auth.currentUser.uid);
          await setDoc(userTokenRef, { token: currentToken, uid: auth.currentUser.uid });
          alert("알림 수신이 설정되었습니다!");
        }
      } else {
        console.log('No registration token available. Request permission to generate one.');
        alert("알림 권한이 필요합니다.");
      }

      // 앱이 포그라운드(화면이 켜진 상태)일 때 메시지 수신 리스너
      onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // 포그라운드에서는 알림이 자동으로 뜨지 않으므로, 직접 UI를 만들어 보여주거나
        // 여기서 new Notification()을 호출하여 알림을 띄울 수 있습니다.
        new Notification(payload.notification?.title || "새 알림", {
          body: payload.notification?.body,
          icon: payload.notification?.icon,
        });
      });

    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
    }
  }, [isNotificationSupported]);

  // --- 2. 햅틱 (진동) 기능 ---
  const triggerHapticFeedback = useCallback((pattern: VibratePattern = 200) => {
    if (!isVibrationSupported) return;
    navigator.vibrate(pattern);
  }, [isVibrationSupported]);

  // --- 3. 화면 켜짐 유지 (Wake Lock) ---
  const requestWakeLock = useCallback(async () => {
    if (!isWakeLockSupported) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      console.log('Screen Wake Lock is active.');
      wakeLockRef.current.addEventListener('release', () => {
        console.log('Screen Wake Lock was released.');
      });
    } catch (err: any) {
      console.error(`${err.name}, ${err.message}`);
    }
  }, [isWakeLockSupported]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  // --- 4. 카메라 접속 ---
  const startCamera = useCallback(async (videoElement: HTMLVideoElement | null) => {
    if (!isCameraSupported || !videoElement) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoElement.srcObject = stream;
      videoElement.play();
      cameraStreamRef.current = stream;
    } catch (err: any) {
      console.error(`Camera access error: ${err.name}, ${err.message}`);
    }
  }, [isCameraSupported]);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  // [수정] 반환 객체를 정리하여 에러를 해결합니다.
  return {
    isNotificationSupported,
    initializeFirebaseMessaging,
    isVibrationSupported,
    triggerHapticFeedback,
    isWakeLockSupported,
    requestWakeLock,
    releaseWakeLock,
    isCameraSupported,
    startCamera,
    stopCamera,
  };
};
