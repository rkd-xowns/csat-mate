import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from '../firebaseConfig';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email.includes('@')) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setIsCodeSent(true);
      console.log(`${email}로 비밀번호 재설정 이메일을 전송했습니다.`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setError('가입되지 않은 이메일입니다.');
      } else {
        setError('이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCodeSent) {
    return (
      <div>
        <h1>이메일 전송 완료</h1>
        <p>{email}으로 비밀번호 재설정 링크를 보냈습니다.</p>
        <p>이메일을 확인하여 비밀번호를 재설정해주세요.</p>
        <button onClick={() => navigate('/login')}>로그인 페이지로 돌아가기</button>
      </div>
    );
  }

  return (
    <div>
      <h1>비밀번호 찾기</h1>
      <p>가입 시 사용한 이메일을 입력하세요.</p>
      <div>
        <label>이메일: </label>
        <input 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
        />
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={handleSendResetEmail} disabled={isLoading}>
        {isLoading ? '전송 중...' : '재설정 이메일 받기'}
      </button>
      <hr />
      <button onClick={() => navigate('/login')}>로그인 페이지로 돌아가기</button>
    </div>
  );
}
