import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebaseConfig';

interface SignupPageProps {
  setSignupUsername: (username: string) => void;
}

export function SignupPage({ setSignupUsername }: SignupPageProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  
  const [error, setError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameCheckResult, setUsernameCheckResult] = useState<'available' | 'taken' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  useEffect(() => {
    setUsernameCheckResult(null);
  }, [username]);

  const usernameRegex = /^[a-zA-Z0-9]{3,}$/;

  const handleUsernameCheck = async () => {
    if (!usernameRegex.test(username)) {
      setError('아이디는 3자 이상의 영문과 숫자만 사용할 수 있습니다.');
      return;
    }
    setIsCheckingUsername(true);
    setError('');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const isAvailable = Math.random() > 0.4;
    setUsernameCheckResult(isAvailable ? 'available' : 'taken');
    setIsCheckingUsername(false);
    if (!isAvailable) setError('이미 사용 중인 아이디입니다.');
  };
  
  const handleSignup = async () => {
    setError('');
    if (!usernameRegex.test(username)) {
      setError('아이디는 3자 이상의 영문과 숫자만 사용할 수 있습니다.');
      return;
    }
    if (usernameCheckResult !== 'available') {
      setError('아이디 중복 확인을 해주세요.');
      return;
    }
    if (!email.includes('@')) {
        setError('올바른 이메일 형식을 입력해주세요.');
        return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!termsAgreed || !privacyAgreed) {
      setError('필수 약관에 동의해주세요.');
      return;
    }
    
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('회원가입 성공:', userCredential.user);
      
      await sendEmailVerification(userCredential.user);
      console.log('인증 이메일 발송 완료.');
      
      setIsVerificationSent(true);

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
        setIsLoading(false);
    }
  };

  if (isVerificationSent) {
    return (
      <div>
        <h1>이메일 인증 필요</h1>
        <p>{email} 주소로 인증 링크를 보냈습니다.</p>
        <p>이메일을 확인하여 계정을 활성화해주세요.</p>
        <hr />
        <button onClick={() => {
          // 이 버튼을 누를 때 setSignupUsername이 사용됩니다.
          setSignupUsername(username);
          navigate('/profile-setup');
        }}>
          프로필 설정 계속하기
        </button>
        <button onClick={() => navigate('/login')}>로그인 페이지로 돌아가기</button>
      </div>
    );
  }

  return (
    <div>
      <h1>회원가입 페이지</h1>
      <hr />
      <div>
        <label>아이디:
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="영문/숫자, 3자 이상" />
        </label>
        <button onClick={handleUsernameCheck} disabled={isCheckingUsername || !username}>
          {isCheckingUsername ? '확인 중...' : '중복확인'}
        </button>
        {usernameCheckResult === 'available' && <span style={{color: 'green'}}>사용 가능</span>}
      </div>
      <div>
        <label>이메일: <input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      </div>
      <div>
        <label>비밀번호: </label>
        <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="8자 이상"/>
        <button onClick={() => setShowPassword(!showPassword)}>{showPassword ? '숨기기' : '보이기'}</button>
      </div>
      <div>
        <label>비밀번호 확인: </label>
        <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}/>
        <button onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? '숨기기' : '보이기'}</button>
      </div>
      <hr />
      <div>
        <label><input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} /> [필수] 이용약관</label>
      </div>
      <div>
        <label><input type="checkbox" checked={privacyAgreed} onChange={e => setPrivacyAgreed(e.target.checked)} /> [필수] 개인정보처리방침</label>
      </div>
      <hr />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={handleSignup} disabled={isLoading}>{isLoading ? '가입 중...' : '다음 단계'}</button>
      <button onClick={() => navigate('/login')}>로그인 페이지로 돌아가기</button>
    </div>
  );
}
