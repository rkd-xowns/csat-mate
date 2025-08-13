import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPermissionAndGetToken, checkBrowserCompatibility } from '../utils/firebaseMessaging';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
// Tone.js는 index.html의 script 태그로 불러오므로, 타입 선언만 해줍니다.
declare const Tone: any;

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

const isInStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (navigator as any).standalone === true;
};

export const PwaFeatureTester: React.FC = () => {
  const navigate = useNavigate();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('준비됨');
  const [showIosInstallPrompt, setShowIosInstallPrompt] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // --- [신규] 오디오 기능 상태 및 ref ---
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isWhiteNoisePlaying, setIsWhiteNoisePlaying] = useState(false);
  const noiseSynth = useRef<any>(null);
  const alertSynth = useRef<any>(null);

  // Tone.js 오디오 컨텍스트를 초기화하는 함수 (사용자 클릭 시 호출)
  const initializeAudio = async () => {
    if (isAudioReady || typeof Tone === 'undefined') return;
    
    await Tone.start();
    noiseSynth.current = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 1, sustain: 1, release: 1 },
      volume: -25,
    }).toDestination();
    
    alertSynth.current = new Tone.Synth().toDestination();
    
    setIsAudioReady(true);
    console.log("Audio context started");
  };

  useEffect(() => {
    const initializeApp = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
          console.log('Service Worker 등록 성공:', registration.scope);
        } catch (err) {
          console.error('Service Worker 등록 실패:', err);
        }
      }
      const compatibility = await checkBrowserCompatibility();
      setBrowserInfo(compatibility);
      if (isIOS() && !isInStandaloneMode()) {
        setShowIosInstallPrompt(true);
        setStatusMessage("iOS에서는 홈 화면에 앱을 추가한 후 푸시 알림을 받을 수 있습니다.");
      } else {
        setStatusMessage("알림 권한을 요청할 준비가 되었습니다.");
      }
    };
    initializeApp();
  }, []);

  const handleGetTokenClick = async () => {
    setIsLoading(true);
    setStatusMessage("토큰 요청 중...");
    try {
      const token = await requestPermissionAndGetToken();
      if (token) {
        setFcmToken(token);
        const isSafariBrowser = browserInfo?.browser?.isSafari;
        setStatusMessage(isSafariBrowser ? "Safari 푸시 구독 성공! (Web Push API 사용)" : "FCM 토큰 발급 성공!");
        if (auth.currentUser) {
          try {
            const userTokenRef = doc(db, "fcmTokens", auth.currentUser.uid);
            await setDoc(userTokenRef, { 
              token, 
              uid: auth.currentUser.uid,
              createdAt: new Date(),
              userAgent: navigator.userAgent,
              browser: browserInfo?.browser,
              type: isSafariBrowser ? 'safari-webpush' : 'fcm'
            });
            setStatusMessage(isSafariBrowser ? "Safari 푸시 구독 및 서버 저장 성공!" : "FCM 토큰 발급 및 서버 저장 성공!");
          } catch (error) {
            console.error("Firestore 저장 오류:", error);
            setStatusMessage("토큰은 발급되었으나 서버 저장에 실패했습니다.");
          }
        } else {
          setStatusMessage(isSafariBrowser ? "Safari 푸시 구독 성공! (로그인하지 않음)" : "FCM 토큰 발급 성공! (로그인하지 않음)");
        }
      } else {
        setStatusMessage("토큰 발급에 실패했습니다. 브라우저 호환성을 확인해주세요.");
      }
    } catch (error: any) {
      console.error("토큰 요청 오류:", error);
      if (error.message === "PWA_INSTALL_REQUIRED") {
        setShowIosInstallPrompt(true);
        setStatusMessage("iOS Safari에서는 홈 화면에 앱을 추가한 후 사용해주세요.");
      } else {
        setStatusMessage(`토큰 요청 실패: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const triggerHapticFeedback = useCallback((pattern: VibratePattern = 200) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
    else alert("이 기기는 햅틱 피드백을 지원하지 않습니다.");
  }, []);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        alert('화면 켜짐 유지가 활성화되었습니다.');
        wakeLockRef.current.addEventListener('release', () => console.log('Screen Wake Lock was released.'));
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
        alert('화면 켜짐 유지를 활성화할 수 없습니다.');
      }
    } else alert("이 기기는 화면 켜짐 유지를 지원하지 않습니다.");
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      alert('화면 켜짐 유지가 비활성화되었습니다.');
    }
  }, []);

  const startCamera = useCallback(async (videoElement: HTMLVideoElement | null) => {
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices && videoElement) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoElement.srcObject = stream;
        videoElement.style.display = 'block';
        videoElement.play();
        cameraStreamRef.current = stream;
      } catch (err: any) {
        console.error(`Camera access error: ${err.name}, ${err.message}`);
        alert('카메라에 접근할 수 없습니다.');
      }
    } else alert("이 기기는 카메라 접근을 지원하지 않습니다.");
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
      if (videoRef.current) videoRef.current.style.display = 'none';
    }
  }, []);

  const copyBrowserInfo = () => {
    if (browserInfo) {
      const info = JSON.stringify(browserInfo, null, 2);
      navigator.clipboard.writeText(info).then(() => alert('브라우저 정보가 클립보드에 복사되었습니다.')).catch(() => console.log('브라우저 정보:', info));
    }
  };

  // --- [신규] 오디오 제어 핸들러 ---
  const handleToggleWhiteNoise = async () => {
    if (!isAudioReady) await initializeAudio();
    if (noiseSynth.current) {
      if (isWhiteNoisePlaying) {
        noiseSynth.current.triggerRelease();
        setIsWhiteNoisePlaying(false);
      } else {
        noiseSynth.current.triggerAttack();
        setIsWhiteNoisePlaying(true);
      }
    }
  };

  const handlePlayAlertSound = async () => {
    if (!isAudioReady) await initializeAudio();
    if (alertSynth.current) {
      alertSynth.current.triggerAttackRelease("C5", "8n");
    }
  };

  return (
    <div className="page-layout login-container justify-center">
      <div className="login-content-area max-w-lg flex flex-col items-center gap-4">
        <div className="text-center">
          <h1 className="title-text">PWA 기능 테스트</h1>
          <p className="description-text">필요한 기능을 호출하여 사용해보세요.</p>
        </div>

        {browserInfo && (
          <div className="w-full p-4 rounded-lg text-sm" style={{backgroundColor: 'var(--card-border)'}}>
            <div className="flex justify-between items-center mb-2">
              <p className="font-bold" style={{color: 'var(--text-primary)'}}>브라우저 호환성</p>
              <button onClick={copyBrowserInfo} className="text-xs px-2 py-1 rounded" style={{backgroundColor: 'var(--highlight-primary)', color: 'var(--highlight-primary-text)'}}>복사</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>알림 지원: {browserInfo.notifications ? '✅' : '❌'}</div>
              <div>Service Worker: {browserInfo.serviceWorker ? '✅' : '❌'}</div>
              <div>Push Manager: {browserInfo.pushManager ? '✅' : '❌'}</div>
              <div>FCM 지원: {browserInfo.fcmSupported ? '✅' : '❌'}</div>
              <div>HTTPS: {browserInfo.https ? '✅' : '❌'}</div>
              <div>Safari: {browserInfo.browser.isSafari ? '✅' : '❌'}</div>
              <div>Brave: {browserInfo.browser.isBrave ? '✅' : '❌'}</div>
              <div>iOS: {browserInfo.browser.isIOSDevice ? '✅' : '❌'}</div>
              <div>PWA 모드: {browserInfo.browser.isStandalone ? '✅' : '❌'}</div>
            </div>
          </div>
        )}

        {showIosInstallPrompt ? (
          <div className="actions-panel w-full flex flex-col items-center gap-4 text-center">
            <p className="font-bold" style={{color: 'var(--text-primary)'}}>알림을 받으려면 홈 화면에 추가해주세요!</p>
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>1. 하단의 '공유' 아이콘을 누르세요.</p>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>2. '홈 화면에 추가'를 선택하세요.</p>
            <button onClick={handleGetTokenClick} disabled={isLoading} className="primary-button mt-4">{isLoading ? '처리 중...' : '그래도 시도해보기'}</button>
          </div>
        ) : (
          <div className="actions-panel w-full flex flex-col gap-4">
            <button onClick={handleGetTokenClick} disabled={isLoading} className="primary-button mb-0">{isLoading ? '처리 중...' : '알림 권한 요청 및 토큰 발급'}</button>
            <div className="text-center p-4 rounded-lg" style={{backgroundColor: 'var(--card-border)'}}>
              <p className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>상태</p>
              <p className="font-bold" style={{color: 'var(--text-primary)'}}>{statusMessage}</p>
            </div>
            {fcmToken && (
              <div className="text-left p-4 rounded-lg" style={{backgroundColor: 'var(--card-border)', wordBreak: 'break-all'}}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>{browserInfo?.browser?.isSafari ? 'Safari 푸시 구독 정보' : 'FCM 토큰'}</p>
                  <button onClick={() => navigator.clipboard.writeText(fcmToken)} className="text-xs px-2 py-1 rounded" style={{backgroundColor: 'var(--highlight-primary)', color: 'var(--highlight-primary-text)'}}>복사</button>
                </div>
                <p className="text-xs" style={{color: 'var(--text-primary)'}}>{fcmToken}</p>
                {browserInfo?.browser?.isSafari && (<p className="text-xs mt-2" style={{color: 'var(--text-secondary)'}}>* Safari는 FCM 대신 Web Push API를 사용합니다</p>)}
              </div>
            )}
            
            {/* [신규] 오디오 제어 버튼 추가 */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t" style={{borderColor: 'var(--card-border)'}}></div>
              <span className="flex-shrink mx-2 text-xs" style={{color: 'var(--text-secondary)'}}>오디오 기능</span>
              <div className="flex-grow border-t" style={{borderColor: 'var(--card-border)'}}></div>
            </div>
            <button onClick={handleToggleWhiteNoise} className="secondary-button">{isWhiteNoisePlaying ? '배경 소음 끄기 🔇' : '배경 소음 켜기 🔊'}</button>
            <button onClick={handlePlayAlertSound} className="secondary-button">알림음 재생 🔔</button>

            <button onClick={() => triggerHapticFeedback([100, 50, 100])} className="secondary-button">햅틱 피드백 (진동)</button>
            <div className="flex gap-2">
              <button onClick={requestWakeLock} className="secondary-button flex-1">화면 켜짐 유지 시작</button>
              <button onClick={releaseWakeLock} className="secondary-button flex-1">화면 켜짐 유지 중지</button>
            </div>
            <video ref={videoRef} className="w-full rounded-lg bg-gray-900" style={{ display: 'none' }}></video>
            <div className="flex gap-2">
              <button onClick={() => startCamera(videoRef.current)} className="secondary-button flex-1">카메라 시작</button>
              <button onClick={stopCamera} className="secondary-button flex-1">카메라 중지</button>
            </div>
          </div>
        )}
        
        <button onClick={() => navigate(-1)} className="guest-link self-center underline">
          이전 페이지로 돌아가기
        </button>
      </div>
    </div>
  );
};
