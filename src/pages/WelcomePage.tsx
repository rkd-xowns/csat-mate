import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';

export function WelcomePage() {
  const navigate = useNavigate();
  const { isMobile, isLandscape } = useResponsive();

  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const pageTexts = [
    "수능 준비를 위한 스마트한 학습 동반자",
    "체계적인 학습 관리와 진도 추적",
    "맞춤형 문제 추천과 성과 분석"
  ];

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage !== currentPage && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage(newPage);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 300);
    }
  }, [currentPage, isTransitioning]);

  useEffect(() => {
    const interval = setInterval(() => {
      // functional update를 사용하여 항상 최신 currentPage 값을 기준으로 다음 페이지를 계산합니다.
      setCurrentPage(prevPage => (prevPage + 1) % pageTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [pageTexts.length]);

  const BrandingContent = () => (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="rounded-2xl flex items-center justify-center logo-card">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M7 12v5l5 3 5-3v-5"/></svg>
      </div>
      <h1 className="title-text">수능메이트</h1>
      <p className="description-text">함께 성장하는 수능 준비 플랫폼</p>
    </div>
  );

  return (
    <div className="welcome-container">
      {isLandscape && isMobile && <div className="branding-area"><BrandingContent /></div>}

      <div className="main-content-area">
        {(!isLandscape || !isMobile) && <BrandingContent />}

        <div className="actions-panel">
          <button onClick={() => navigate('/login')} className="primary-button mb-[3vh]">
            로그인
          </button>
          <div className="flex items-center w-full mb-4">
            <div className="flex-1 h-px bg-[var(--card-border)]"></div>
            <span className="px-3 text-sm text-[var(--text-secondary)]">또는</span>
            <div className="flex-1 h-px bg-[var(--card-border)]"></div>
          </div>
          <div className="flex gap-3">
            <button className="secondary-button flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              공지사항
            </button>
            <button className="secondary-button flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
              도움말
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="carousel-text flex items-center justify-center">
          <p className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {pageTexts[currentPage]}
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          {pageTexts.map((_, index) => (
            <button 
              key={index} 
              className={`indicator ${currentPage === index ? 'active' : 'inactive'}`}
              onClick={() => handlePageChange(index)} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
