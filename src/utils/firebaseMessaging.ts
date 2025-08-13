import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "../firebaseConfig";

const VAPID_KEY = "BK8Qb-TG5HEHsUwGcF9UVDWRspbQdnmE2P3phBb5WaaFEH93kh0IyJdtc1PCRHW3wklf05tR0qngSKMgxBgR1Ts";

// 브라우저 감지 함수들
const isSafari = (): boolean => {
  const userAgent = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(userAgent) && 
         !/CriOS/i.test(userAgent) && 
         !/FxiOS/i.test(userAgent);
};

const isBrave = async (): Promise<boolean> => {
  return (navigator as any).brave && await (navigator as any).brave.isBrave() || false;
};

const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (navigator as any).standalone === true;
};

// VAPID 키를 Uint8Array로 변환
const urlB64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// ArrayBuffer를 Base64로 변환
const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Safari PWA 푸시 처리
const handleSafariPush = async (): Promise<string | null> => {
  console.log("Safari 브라우저 감지, PWA 푸시 처리 시작");
  
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log("Safari에서 Service Worker 또는 Push Manager를 지원하지 않습니다");
    return null;
  }

  try {
    // Service Worker 등록 대기
    const registration = await navigator.serviceWorker.ready;
    
    // 기존 구독 확인
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log("기존 Safari 푸시 구독 발견:", existingSubscription.endpoint);
      // Safari의 경우 구독 정보를 JSON 문자열로 반환
      return JSON.stringify({
        endpoint: existingSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(existingSubscription.getKey('p256dh')),
          auth: arrayBufferToBase64(existingSubscription.getKey('auth'))
        }
      });
    }

    // 새 푸시 구독 생성
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_KEY)
    });
    
    console.log("Safari 푸시 구독 생성 완료:", subscription);
    
    // 구독 정보를 서버에서 사용할 수 있는 형태로 변환
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth'))
      }
    };
    
    return JSON.stringify(subscriptionData);
  } catch (error) {
    console.error("Safari 푸시 구독 실패:", error);
    return null;
  }
};

export const requestPermissionAndGetToken = async (): Promise<string | null> => {
  console.log("알림 권한 요청 시작...");
  console.log("User Agent:", navigator.userAgent);
  console.log("현재 URL:", window.location.href);
  console.log("Protocol:", window.location.protocol);
  
  // HTTPS 확인
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    console.error("HTTPS 연결이 필요합니다");
    return null;
  }

  // 기본 지원 확인
  if (!('Notification' in window)) {
    console.log("이 브라우저는 알림을 지원하지 않습니다");
    return null;
  }

  // 1. 알림 권한 요청
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log("알림 권한이 거부되었습니다:", permission);
    return null;
  }

  console.log("알림 권한 승인됨");

  // 2. 브라우저별 처리
  try {
    const safariDetected = isSafari();
    const braveDetected = await isBrave();
    
    console.log("브라우저 감지 결과:", {
      safari: safariDetected,
      brave: braveDetected,
      ios: isIOSDevice(),
      standalone: isStandalone()
    });

    // Safari 처리
    if (safariDetected) {
      console.log("Safari 브라우저 처리 시작");
      
      if (isIOSDevice()) {
        // iOS Safari는 PWA 모드에서만 푸시 지원
        if (!isStandalone()) {
          console.log("iOS Safari에서는 홈 화면에 추가한 후 PWA 모드에서만 푸시 알림을 지원합니다");
          throw new Error("PWA_INSTALL_REQUIRED");
        }
      }
      
      // Safari 전용 푸시 처리
      const safariResult = await handleSafariPush();
      if (safariResult) {
        console.log("Safari 푸시 구독 성공:", safariResult);
        return safariResult;
      } else {
        console.log("Safari 푸시 구독 실패");
        return null;
      }
    }

    // FCM 지원 확인 (Chrome, Brave, Firefox 등)
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      console.log("이 브라우저에서는 Firebase Messaging을 지원하지 않습니다");
      return null;
    }

    // Service Worker 확인 및 등록
    if (!('serviceWorker' in navigator)) {
      console.log("Service Worker를 지원하지 않습니다");
      return null;
    }

    let registration: ServiceWorkerRegistration;
    try {
      // 이미 등록된 Service Worker 확인
      registration = await navigator.serviceWorker.ready;
      console.log("기존 Service Worker 사용:", registration.scope);
    } catch (error) {
      console.log("Service Worker 등록 필요, 수동 등록 시도");
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        console.log("Service Worker 수동 등록 성공:", registration.scope);
        
        // 등록 완료 대기
        await new Promise((resolve) => {
          if (registration.active) {
            resolve(undefined);
          } else {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'activated') {
                    resolve(undefined);
                  }
                });
              }
            });
          }
        });
      } catch (regError) {
        console.error("Service Worker 등록 실패:", regError);
        return null;
      }
    }

    // FCM 메시징 초기화
    console.log("FCM 메시징 초기화 시작");
    const messaging = getMessaging(app);
    
    // 토큰 요청
    const currentToken = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (currentToken) {
      console.log("FCM 토큰 발급 성공:", currentToken);
      return currentToken;
    } else {
      console.log("FCM 토큰을 받을 수 없습니다");
      
      // 추가 디버깅 정보
      console.log("디버깅 정보:");
      console.log("- Service Worker 상태:", registration.active?.state);
      console.log("- Push Manager 지원:", 'PushManager' in window);
      console.log("- 알림 권한:", Notification.permission);
      console.log("- 현재 포커스:", document.hasFocus());
      
      return null;
    }
    
  } catch (err: any) {
    console.error("토큰 획득 중 오류 발생:", err);
    
    // 특정 에러 처리
    if (err.message === "PWA_INSTALL_REQUIRED") {
      throw err; // 상위로 전달하여 UI에서 설치 안내 표시
    }
    
    // Firebase 에러 코드별 처리
    if (err.code) {
      switch (err.code) {
        case 'messaging/unsupported-browser':
          console.log("지원되지 않는 브라우저입니다");
          break;
        case 'messaging/permission-blocked':
          console.log("알림 권한이 차단되었습니다");
          break;
        case 'messaging/vapid-key-required':
          console.log("VAPID 키가 필요합니다");
          break;
        case 'messaging/registration-token-not-available':
          console.log("등록 토큰을 사용할 수 없습니다");
          break;
        default:
          console.log("알 수 없는 Firebase 오류:", err.code, err.message);
      }
    }
    
    return null;
  }
};

// 브라우저 호환성 체크
export const checkBrowserCompatibility = async () => {
  const compatibility = {
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    fcmSupported: await isSupported(),
    https: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
    browser: {
      userAgent: navigator.userAgent,
      isSafari: isSafari(),
      isBrave: await isBrave(),
      isIOSDevice: isIOSDevice(),
      isStandalone: isStandalone()
    }
  };
  
  console.log("브라우저 호환성 정보:", compatibility);
  return compatibility;
};