import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from '../firebaseConfig';

interface SignupPageProps {
  setSignupUsername: (username: string) => void;
}

export function SignupPage({ setSignupUsername }: SignupPageProps) {
  // --- 1. 상태 관리 (State Management) ---
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameCheckResult, setUsernameCheckResult] = useState<'available' | 'taken' | null>(null);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [focusState, setFocusState] = useState<'none' | 'username' | 'email' | 'password' | 'confirmPassword'>('none');
  const [screenInfo, setScreenInfo] = useState({
    vh: window.innerHeight,
    isMobile: window.innerWidth <= 768,
    isKeyboardVisible: false,
  });

  // --- 2. 이펙트 훅 (useEffect Hooks) ---
  useEffect(() => {
    const initialHeight = window.innerHeight;
    const handleResize = () => {
      const currentVh = window.innerHeight;
      const isMobile = window.innerWidth <= 768;
      const isKeyboardVisible = isMobile && (initialHeight - currentVh > 200);
      setScreenInfo({ vh: currentVh, isMobile, isKeyboardVisible });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
        setFocusState('none');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    setUsernameCheckResult(null);
  }, [username]);

  useEffect(() => {
    if (!isVerificationSent) return;
    const intervalId = setInterval(async () => {
      if (!auth.currentUser) return;
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        clearInterval(intervalId);
        navigate('/profile-setup');
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isVerificationSent, navigate]);

  // --- 3. 유틸리티 및 핸들러 함수 (Utilities & Handlers) ---
  const getAdaptiveSize = () => {
    const { vh, isKeyboardVisible } = screenInfo;
    const ratio = Math.max(0.8, Math.min(1.1, vh / 850));
    const shrinkFactor = isKeyboardVisible ? 0.6 : 1;
    return {
      showLogoAndDesc: !isKeyboardVisible,
      logoSize: 80 * ratio * shrinkFactor,
      logoMarginBottom: 20 * ratio * shrinkFactor,
      titleFormGap: 12 * ratio * shrinkFactor,
      panelInternalGap: isKeyboardVisible ? 10 * ratio : 16 * ratio,
      inputGroupGap: isKeyboardVisible ? 2 : 4,
      titleFontSize: 28 * ratio * shrinkFactor,
      descFontSize: 14 * ratio * shrinkFactor,
    };
  };
  const adaptiveSize = getAdaptiveSize();

  const validateUsername = (id: string): { isValid: boolean, message: string } => {
    if (id.length < 3 || id.length > 30) {
      return { isValid: false, message: '아이디는 3자 이상 30자 이하로 입력해주세요.' };
    }
    if (/[^a-zA-Z0-9_.]/.test(id)) {
      return { isValid: false, message: '아이디는 영문, 숫자, 밑줄(_), 마침표(.)만 사용 가능해요.' };
    }
    if (id.startsWith('.') || id.endsWith('.')) {
      return { isValid: false, message: '마침표(.)는 아이디의 시작 또는 끝에 사용할 수 없습니다.' };
    }
    if (/\.\./.test(id)) {
      return { isValid: false, message: '마침표(.)는 연속으로 사용할 수 없습니다.' };
    }
    return { isValid: true, message: '' };
  };

  const handleUsernameCheck = async () => {
    const validation = validateUsername(username);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }
    setIsCheckingUsername(true);
    setError('');
    try {
      const usernameToCheck = username.toLowerCase();
      const docRef = doc(db, "usernames", usernameToCheck);
      const docSnap = await getDoc(docRef);
      const isAvailable = !docSnap.exists();
      setUsernameCheckResult(isAvailable ? 'available' : 'taken');
      if (!isAvailable) {
        setError('이미 사용 중인 아이디입니다.');
      }
    } catch (err) {
      setError("아이디 확인 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSignup = async () => {
    setError('');
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) { setError(usernameValidation.message); return; }
    if (usernameCheckResult !== 'available') { setError('아이디 중복 확인을 해주세요.'); return; }
    if (!email.includes('@')) { setError('올바른 이메일 형식을 입력해주세요.'); return; }
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return; }
    if (password !== confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); return; }
    if (!termsAgreed || !privacyAgreed) { setError('필수 약관에 동의해주세요.'); return; }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setIsVerificationSent(true);
      setSignupUsername(username.toLowerCase());
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') { setError('이미 사용 중인 이메일입니다.'); }
      else { setError('회원가입에 실패했습니다. 다시 시도해주세요.'); }
    } finally {
      setIsLoading(false);
    }
  };

  const getEmoji = () => {
    if (error) return '😥';
    if (focusState === 'password' || focusState === 'confirmPassword') return '🤫';
    if (focusState === 'username' || focusState === 'email') return '😊';
    return '👋';
  };

  // --- 4. 렌더링 (Rendering) ---
  if (isVerificationSent) {
    return (
      <div className="page-layout login-container justify-center">
        <div className="login-content-area max-w-lg flex flex-col items-center">
          <div className="text-center actions-panel w-full">
            <h1 className="title-text">✉️ 이메일 인증 대기 중</h1>
            <p className="description-text mt-4">
              <strong>{email}</strong> 주소로 인증 링크를 보냈습니다.<br />
              이메일을 확인하여 인증을 완료해주세요.
            </p>
            <div className="animate-pulse mt-6 text-gray-500">
              인증 완료 시 자동으로 다음 단계로 이동합니다...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout login-container justify-center">
      <div className="login-content-area max-w-lg flex flex-col items-center">
        {adaptiveSize.showLogoAndDesc ? (
          <>
            <div
              className="logo-card flex items-center justify-center rounded-2xl text-5xl"
              style={{ width: adaptiveSize.logoSize, height: adaptiveSize.logoSize, marginBottom: `${adaptiveSize.logoMarginBottom}px` }}
            >
              <span>{getEmoji()}</span>
            </div>
            <div className="text-center" style={{ marginBottom: `${adaptiveSize.titleFormGap}px` }}>
              <h1 className="title-text" style={{ fontSize: `${adaptiveSize.titleFontSize}px` }}>
                {isLoading ? '가입 처리 중...' : '회원가입'}
              </h1>
              <p className="description-text" style={{ fontSize: `${adaptiveSize.descFontSize}px` }}>
                수능메이트와 함께 공부 여정을 시작해보세요
              </p>
            </div>
          </>
        ) : (
          <div className="text-center" style={{ marginBottom: `${adaptiveSize.titleFormGap}px` }}>
            <h1 className="title-text" style={{ fontSize: `${adaptiveSize.titleFontSize}px` }}>
              {isLoading ? '가입 처리 중...' : '회원가입'}
            </h1>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}

        <div className="actions-panel w-full flex flex-col" style={{ gap: `${adaptiveSize.inputGroupGap}px` }}>
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>아이디</label>
            <div className="flex items-stretch gap-2">
              <input
                id="username"
                type="text"
                placeholder="아이디 (3자 이상)"
                value={username}
                onChange={e => {
                  const filteredValue = e.target.value.replace(/[^a-zA-Z0-9_.]/g, '');
                  setUsername(filteredValue);
                }}
                maxLength={30}
                className={`login-input flex-1 ${usernameCheckResult === 'taken' ? 'error' : ''}`}
                onFocus={() => setFocusState('username')}
                onBlur={() => setFocusState('none')}
                disabled={isLoading}
              />
              <button onClick={handleUsernameCheck} className={`input-adjacent-button ${usernameCheckResult === 'available' ? 'success' : ''}`} disabled={isCheckingUsername || !username || usernameCheckResult === 'available'}>
                {isCheckingUsername ? '확인중...' : usernameCheckResult === 'available' ? '확인 완료' : '중복확인'}
              </button>
            </div>
            {usernameCheckResult === 'available' && <p className="text-sm font-medium" style={{ color: 'var(--color-accent-green)' }}>사용 가능한 아이디입니다.</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>이메일</label>
            <input id="email" type="email" placeholder="이메일을 입력하세요" value={email} onChange={e => setEmail(e.target.value)} className="login-input" onFocus={() => setFocusState('email')} onBlur={() => setFocusState('none')} disabled={isLoading} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>비밀번호</label>
            <div className="relative w-full">
              <input id="password" type={showPassword ? 'text' : 'password'} placeholder="비밀번호 (8자 이상)" value={password} onChange={e => setPassword(e.target.value)} className="login-input pr-10" onFocus={() => setFocusState('password')} onBlur={() => setFocusState('none')} disabled={isLoading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" className="opacity-50">{showPassword ? (<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>)}</svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>비밀번호 확인</label>
            <div className="relative w-full">
              <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="비밀번호를 다시 입력하세요" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="login-input pr-10" onFocus={() => setFocusState('confirmPassword')} onBlur={() => setFocusState('none')} disabled={isLoading} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle-button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" className="opacity-50">{showConfirmPassword ? (<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>)}</svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} disabled={isLoading} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>[필수] 이용약관에 동의합니다.</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={privacyAgreed} onChange={e => setPrivacyAgreed(e.target.checked)} disabled={isLoading} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>[필수] 개인정보처리방침에 동의합니다.</span>
            </label>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button onClick={handleSignup} className="primary-button" disabled={isLoading}>
              {isLoading ? '확인 중...' : '회원가입'}
            </button>
          </div>

          <div className="form-bottom-link">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={() => navigate('/login')}
              disabled={isLoading}
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}