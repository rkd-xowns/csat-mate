import { useState, useEffect } from 'react';

// 이 훅은 앱의 현재 화면 상태(모바일 여부, 가로/세로, 키보드 활성화)를 알려주는 역할을 합니다.
export function useResponsive() {
  const [screenInfo, setScreenInfo] = useState({
    vh: window.innerHeight,
    isMobile: window.innerWidth <= 768,
    isLandscape: window.innerWidth > window.innerHeight,
    isKeyboardVisible: false,
  });

  useEffect(() => {
    const initialVh = window.innerHeight;

    const handleResize = () => {
      const newVh = window.innerHeight;
      const newVw = window.innerWidth;
      const isMobile = newVw <= 768;
      
      // 모바일 환경에서만 키보드 활성화를 감지합니다.
      // 화면 높이가 초기 높이의 75% 미만으로 줄어들면 키보드가 올라온 것으로 간주합니다.
      const isKeyboardVisible = isMobile && newVh < initialVh * 0.75;

      setScreenInfo({
        vh: newVh,
        isMobile,
        isLandscape: newVw > newVh,
        isKeyboardVisible,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // 초기 렌더링 시 한번 실행
    handleResize(); 

    // 컴포넌트가 사라질 때 이벤트 리스너를 정리합니다.
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return screenInfo;
}
