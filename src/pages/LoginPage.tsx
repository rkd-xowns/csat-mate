import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword,
  signInWithPopup, 
  GoogleAuthProvider,
  signInAnonymously,
  type User 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
// [추가] GuestConfirmDialog 컴포넌트를 import 합니다.
import { GuestConfirmDialog } from '../components/GuestConfirmDialog'; // 경로는 실제 파일 위치에 맞게 수정해주세요.

interface LoginPageProps {
  setSignupUsername: (username: string) => void;
}




export function LoginPage({ setSignupUsername }: LoginPageProps) {
  // --- 1. 기능 로직 및 상태 ---
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusState, setFocusState] = useState<'none' | 'email' | 'password'>('none');
  
  const [showGuestConfirm, setShowGuestConfirm] = useState(false);

  // --- 2. 반응형 UI 로직 ---
  const [screenInfo, setScreenInfo] = useState({
    vh: window.innerHeight,
    isMobile: window.innerWidth <= 768,
    isKeyboardVisible: false,
  });

  useEffect(() => {
    const initialHeight = window.innerHeight;
    const handleResize = () => {
      const currentVh = window.innerHeight;
      const isMobile = window.innerWidth <= 768;
      const isKeyboardVisible = isMobile && (initialHeight - currentVh > 150);
      setScreenInfo({ vh: currentVh, isMobile, isKeyboardVisible });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getAdaptiveSize = () => {
    const vh = screenInfo.vh;
    const ratio = Math.max(0.8, Math.min(1.1, vh / 850));
    const shrinkFactor = screenInfo.isKeyboardVisible ? 0.6 : 1;
    return {
      showLogoAndDesc: !screenInfo.isKeyboardVisible,
      logoSize: 80 * ratio * shrinkFactor,
      logoMarginBottom: 24 * ratio * shrinkFactor,
      titleFormGap: 16 * ratio * shrinkFactor,
      formInternalGap: 16 * ratio,
      titleFontSize: 28 * ratio * shrinkFactor,
      descFontSize: 14 * ratio * shrinkFactor,
      linkFontSize: 13.5 * ratio,
      dialogEmojiSize: 60 * ratio,
      dialogTitleFontSize: 22 * ratio,
      dialogDescFontSize: 15 * ratio,
    };
  };
  const adaptiveSize = getAdaptiveSize();

  // --- 3. 핸들러 함수들 ---
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => { setError(''); setFocusState('none'); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLoginSuccess = () => navigate('/main');
  
  const handleSocialLoginNewUser = (username: string) => {
    setSignupUsername(username);
    navigate('/profile-setup');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      handleLoginSuccess();
    } catch (e) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserAndRedirect = async (user: User) => {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      handleLoginSuccess();
    } else {
      await setDoc(userDocRef, { email: user.email, name: user.displayName || '소셜 사용자', createdAt: new Date() });
      handleSocialLoginNewUser(user.displayName || '새 사용자');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await checkUserAndRedirect(result.user);
    } catch (e) {
      setError("소셜 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
      console.error("Google Sign-In Error: ", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLoginClick = () => {
    setShowGuestConfirm(true);
  };

  const confirmGuestLogin = async () => {
    setShowGuestConfirm(false);
    setIsLoading(true);
    setError('');
    try {
      await signInAnonymously(auth);
      handleLoginSuccess();
    } catch (e) {
      setError("게스트 로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const getEmoji = () => {
    if (error) return '😧';
    if (focusState === 'password') return '🫣';
    return '😀';
  };

  return (
    <>
      <GuestConfirmDialog 
        show={showGuestConfirm}
        onConfirm={confirmGuestLogin}
        onCancel={() => setShowGuestConfirm(false)}
        adaptiveSize={adaptiveSize}
      />

      <div className="page-layout login-container justify-center">
        <div className="login-content-area max-w-lg flex flex-col items-center">
          
          {adaptiveSize.showLogoAndDesc && (
            <>
              <div 
                className="logo-card flex items-center justify-center rounded-2xl text-5xl" 
                style={{ 
                  width: adaptiveSize.logoSize, 
                  height: adaptiveSize.logoSize,
                  marginBottom: `${adaptiveSize.logoMarginBottom}px`
                }}
              >
                <span style={{color: 'var(--text-primary)'}}>{getEmoji()}</span>
              </div>

              <div className="text-center" style={{ marginBottom: `${adaptiveSize.titleFormGap}px` }}>
                <h1 className="title-text" style={{ fontSize: `${adaptiveSize.titleFontSize}px` }}>
                  {isLoading ? '로그인 중...' : '로그인'}
                </h1>
                <p className="description-text" style={{ fontSize: `${adaptiveSize.descFontSize}px` }}>
                  수능메이트에 다시 오신 것을 환영합니다
                </p>
              </div>
            </>
          )}

          {!adaptiveSize.showLogoAndDesc && (
            <div className="text-center" style={{ marginBottom: `${adaptiveSize.titleFormGap}px` }}>
              <h1 className="title-text" style={{ fontSize: `${adaptiveSize.titleFontSize}px` }}>
                {isLoading ? '로그인 중...' : '로그인'}
              </h1>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <div className="actions-panel w-full flex flex-col" style={{ gap: `${adaptiveSize.formInternalGap}px` }}>
            
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>아이디</label>
              <input id="email" type="email" placeholder="아이디를 입력하세요" value={email} onChange={e => setEmail(e.target.value)} className={`login-input ${error ? 'error' : ''}`} onFocus={() => setFocusState('email')} onBlur={() => setFocusState('none')} disabled={isLoading} />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>비밀번호</label>
              <div className="password-wrapper items-stretch">
                <div className="relative w-full">
                  <input id="password" type={showPassword ? 'text' : 'password'} placeholder="비밀번호를 입력하세요" value={password} onChange={e => setPassword(e.target.value)} className={`login-input pr-10 ${error ? 'error' : ''}`} onFocus={() => setFocusState('password')} onBlur={() => setFocusState('none')} disabled={isLoading}/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
                      {showPassword ? ( <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" /> ) : ( <> <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /> <circle cx="12" cy="12" r="3" /> </> )}
                    </svg>
                  </button>
                </div>
               <button onClick={() => navigate('/forgot-password')} className={`forgot-password-link mt-1 ${error ? 'error' : ''}`} style={{ fontSize: `${adaptiveSize.linkFontSize}px` }}>비밀번호 찾기</button>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 mt-2">
              <button onClick={handleLogin} className="primary-button mb-0" disabled={isLoading}>
                {isLoading ? '확인 중...' : '로그인'}
              </button>
              <button onClick={() => navigate('/signup')} className="secondary-button" disabled={isLoading}>
                회원가입하기
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t" style={{borderColor: 'var(--card-border)'}}></div>
              <span className="flex-shrink mx-2 text-xs" style={{color: 'var(--text-secondary)'}}>또는</span>
              <div className="flex-grow border-t" style={{borderColor: 'var(--card-border)'}}></div>
            </div>
            
            <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg transition-colors" style={{backgroundColor: 'var(--card-background)', border: '1px solid var(--card-border)'}}>
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.712,34.406,44,28.096,44,20C44,22.659,43.862,21.35,43.611,20.083z"></path>
              </svg>
              <span className="text-sm font-medium" style={{color: 'var(--text-primary)'}}>Google로 계속하기</span>
            </button>
            
            <button 
              onClick={handleGuestLoginClick} 
              className="guest-link self-center underline transition-opacity opacity-70 hover:opacity-100" 
              style={{ fontSize: `${adaptiveSize.linkFontSize}px`, color: 'var(--text-secondary)' }}
            >
              게스트로 시작하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}