import { useRef, useCallback } from 'react';
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "../firebaseConfig";

// VAPID 키는 여기에 한 번만 정의합니다.
const VAPID_KEY = "BK8Qb-TG5HEHsUwGcF9UVDWRspbQdnmE2P3phBb5WaaFEH93kh0IyJdtc1PCRHW3wklf05tR0qngSKMgxBgR1Ts";

// --- 헬퍼 함수들 (훅 바깥에 있어도 괜찮습니다) ---

const isSafari = (): boolean => {
  const userAgent = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(userAgent) && !/CriOS/i.test(userAgent) && !/FxiOS/i.test(userAgent);
};

const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
};

const urlB64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// --- 통합된 PWA 기능 커스텀 훅 ---

export const usePwaFeatures = () => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // --- 1. 알림 기능 (firebaseMessaging.ts에서 가져옴) ---
  const requestPermissionAndGetToken = useCallback(async (): Promise<string | null> => {
        console.log("알림 권한 요청 시작...");
    if (!('Notification' in window)) { console.log("이 브라우저는 알림을 지원하지 않습니다"); return null; }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { console.log("알림 권한이 거부되었습니다:", permission); return null; }
    console.log("알림 권한 승인됨");
    try {
      if (isSafari()) {
        if (isIOSDevice() && !isStandalone()) throw new Error("PWA_INSTALL_REQUIRED");
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(VAPID_KEY) });
        const subscriptionData = { endpoint: subscription.endpoint, keys: { p256dh: arrayBufferToBase64(subscription.getKey('p256dh')), auth: arrayBufferToBase64(subscription.getKey('auth')) } };
        return JSON.stringify(subscriptionData);
      }
      const messagingSupported = await isSupported();
      if (!messagingSupported) { console.log("이 브라우저에서는 Firebase Messaging을 지원하지 않습니다"); return null; }
      const messaging = getMessaging(app);
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (currentToken) { return currentToken; } else { console.log("FCM 토큰을 받을 수 없습니다"); return null; }
    } catch (err: any) {
      console.error("토큰 획득 중 오류 발생:", err);
      if (err.message === "PWA_INSTALL_REQUIRED") throw err;
      return null;
    }
  }, []);

  // --- 2. 햅틱 (진동) 기능 ---
  const triggerHapticFeedback = useCallback((pattern: VibratePattern = 200) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    } else {
      // [추가] 지원하지 않을 경우 피드백
      alert("이 기기는 햅틱 피드백을 지원하지 않습니다.");
    }
  }, []);

  // --- 3. 화면 켜짐 유지 (Wake Lock) ---
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        // [추가] 성공 피드백
        alert('화면 켜짐 유지가 활성화되었습니다.');
        wakeLockRef.current.addEventListener('release', () => console.log('Screen Wake Lock was released.'));
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
        // [추가] 실패 피드백
        alert('화면 켜짐 유지를 활성화할 수 없습니다.');
      }
    } else {
      // [추가] 지원하지 않을 경우 피드백
      alert("이 기기는 화면 켜짐 유지를 지원하지 않습니다.");
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      // [추가] 성공 피드백
      alert('화면 켜짐 유지가 비활성화되었습니다.');
    }
  }, []);

  // --- 4. 카메라 접속 ---
  const startCamera = useCallback(async (videoElement: HTMLVideoElement | null) => {
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices && videoElement) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoElement.srcObject = stream;
        videoElement.play();
        cameraStreamRef.current = stream;
      } catch (err: any) {
        console.error(`Camera access error: ${err.name}, ${err.message}`);
        // [추가] 실패 피드백
        alert('카메라에 접근할 수 없습니다.');
      }
    } else {
      // [추가] 지원하지 않을 경우 피드백
      alert("이 기기는 카메라 접근을 지원하지 않습니다.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  // --- 5. 브라우저 호환성 체크 ---
  const checkBrowserCompatibility = useCallback(async () => {
    const compatibility = {
      notifications: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      fcmSupported: await isSupported(),
      https: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      browser: { isSafari: isSafari(), isIOSDevice: isIOSDevice(), isStandalone: isStandalone() }
    };
    console.log("브라우저 호환성 정보:", compatibility);
    return compatibility;
  }, []);

  return {
    requestPermissionAndGetToken,
    triggerHapticFeedback,
    requestWakeLock,
    releaseWakeLock,
    startCamera,
    stopCamera,
    checkBrowserCompatibility,
  };
};
