// src/components/Header.tsx
import React from 'react';

const Header: React.FC = () => {
  return (
    // bg-card: 카드 배경색, p-4: 패딩, flex...: Flexbox 정렬
    <header className="bg-card shadow-md flex items-center justify-between p-4">
      {/* 로고: h2 스타일 적용 */}
      <h2 className="text-h2 font-extrabold text-color-text-primary">MyWebApp</h2>

      <nav>
        {/* 버튼: primary 배경색, 흰색 글씨, 둥근 모서리 등 적용 */}
        <button className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded-lg">
          로그인
        </button>
        <button className="bg-secondary text-secondary-foreground font-bold py-2 px-4 rounded-lg ml-2">
          도움말
        </button>
      </nav>
    </header>
  );
};

export default Header;