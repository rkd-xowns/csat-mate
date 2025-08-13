// firebase-messaging-sw.js
console.log('[SW] Service Worker 로딩 시작');

// Firebase SDK import
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js");

// Firebase 설정 - 실제 프로젝트 설정
const firebaseConfig = {
  apiKey: "AIzaSyBljqwaT-ZWqy1JC0JjlTSSY_wdv4XAnQM",
  authDomain: "csat-mate.firebaseapp.com",
  projectId: "csat-mate",
  storageBucket: "csat-mate.firebasestorage.app",
  messagingSenderId: "265126142033",
  appId: "1:265126142033:web:12313e8b5593d2b1d0d870"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('[SW] Firebase Messaging 초기화 완료');

// 백그라운드 메시지 처리
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] 백그라운드 메시지 수신:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new message',
    icon: payload.notification?.icon || payload.data?.icon || '/icons/192.png',
    badge: '/icons/192.png',
    tag: payload.data?.tag || 'default-notification',
    data: {
      ...payload.data,
      click_action: payload.notification?.click_action || payload.data?.click_action || '/'
    },
    actions: [
      {
        action: 'open',
        title: '열기',
        icon: '/icons/192.png'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ],
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  console.log('[SW] 알림 표시:', notificationTitle, notificationOptions);
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] 알림 클릭됨:', event.notification);
  
  event.notification.close();

  if (event.action === 'close') {
    console.log('[SW] 닫기 액션 선택');
    return;
  }

  // 기본 클릭 또는 '열기' 액션 처리
  const urlToOpen = event.notification.data?.click_action || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      console.log('[SW] 현재 열린 클라이언트:', clientList.length);
      
      // 이미 열린 탭이 있는지 확인
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);
        
        if (clientUrl.origin === targetUrl.origin) {
          console.log('[SW] 기존 탭으로 이동:', client.url);
          return client.focus().then(() => {
            // 특정 경로로 이동이 필요하다면 postMessage 사용
            if (clientUrl.pathname !== targetUrl.pathname) {
              client.postMessage({
                type: 'NAVIGATE',
                url: targetUrl.pathname
              });
            }
          });
        }
      }
      
      // 새 창으로 열기
      if (clients.openWindow) {
        console.log('[SW] 새 창으로 열기:', urlToOpen);
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 일반 Push 이벤트 처리 (FCM이 아닌 직접 push의 경우)
self.addEventListener('push', function(event) {
  console.log('[SW] Push 이벤트 수신');
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[SW] Push 데이터:', data);
      
      const options = {
        body: data.body || 'New message',
        icon: data.icon || '/icons/192.png',
        badge: '/icons/192.png',
        data: data.data || {},
        vibrate: [200, 100, 200],
        tag: data.tag || 'push-notification'
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'Notification', options)
      );
    } catch (error) {
      console.error('[SW] Push 데이터 파싱 오류:', error);
      
      // 파싱 실패 시 기본 알림 표시
      event.waitUntil(
        self.registration.showNotification('New Message', {
          body: 'You have a new message',
          icon: '/icons/192.png'
        })
      );
    }
  } else {
    console.log('[SW] Push 데이터 없음');
  }
});

// Service Worker 설치
self.addEventListener('install', function(event) {
  console.log('[SW] Service Worker 설치 중');
  // 즉시 활성화
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', function(event) {
  console.log('[SW] Service Worker 활성화 중');
  // 모든 클라이언트를 즉시 제어
  event.waitUntil(self.clients.claim());
});

// 브라우저별 호환성 처리
self.addEventListener('message', function(event) {
  console.log('[SW] 메시지 수신:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 에러 처리
self.addEventListener('error', function(event) {
  console.error('[SW] Service Worker 오류:', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
  console.error('[SW] 처리되지 않은 Promise 거부:', event.reason);
});

console.log('[SW] Service Worker 설정 완료');