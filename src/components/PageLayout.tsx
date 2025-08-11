import type { ReactNode } from 'react';

// PageLayout은 이제 className을 사용하여 index.css의 스타일을 적용합니다.
export function PageLayout({ children }: { children: ReactNode }) {
  return (
    // 불필요한 변수 선언을 제거하고 className만 남깁니다.
    <div className="page-layout">
      {children}
    </div>
  );
}
