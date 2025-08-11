import { useTheme } from '../contexts/ThemeContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}



export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onToggle, onClose }) => {
  const { isDarkMode, toggleThemeMode, themeStyle, setThemeStyle } = useTheme();

  return (
    <>
      <button
        onClick={onToggle}
        className="fixed top-0 right-0 z-50 p-2 rounded-full transition-all duration-300"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
          right: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Open settings panel"
      >
       <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isDarkMode ? 'white' : 'black'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>  
      </button>

      <div
        className={`fixed top-0 right-0 h-full z-40 p-6 transition-transform duration-300 ease-in-out`}
        style={{
          width: '280px',
          backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(248, 249, 250, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '-10px 0 20px rgba(0,0,0,0.2)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          paddingTop: `calc(env(safe-area-inset-top, 0px) + 1.5rem)`,
          paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 1.5rem)`,
        }}
      >
        <h3 className='text-xl font-bold mb-6' style={{ color: isDarkMode ? 'white' : 'black' }}>설정</h3>
        
        <div className="space-y-4">
          <div>
            <p className='font-medium mb-2' style={{color: isDarkMode ? 'white' : 'black'}}>모드</p>
            <button onClick={toggleThemeMode} className='w-full p-2 rounded-lg' style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isDarkMode ? 'white' : 'black' }}>
              {isDarkMode ? '라이트 모드로 변경' : '다크 모드로 변경'}
            </button>
          </div>

          <div>
            <p className='font-medium mb-2' style={{color: isDarkMode ? 'white' : 'black'}}>테마 스타일</p>
            <div className="flex gap-2">
              <button onClick={() => setThemeStyle('vibrant')} className='flex-1 p-2 rounded-lg' style={{ backgroundColor: themeStyle === 'vibrant' ? (isDarkMode ? '#8B5FAD' : '#2563EB') : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'), color: 'white' }}>
                화려한
              </button>
              <button onClick={() => setThemeStyle('minimal')} className='flex-1 p-2 rounded-lg' style={{ backgroundColor: themeStyle === 'minimal' ? (isDarkMode ? '#8B5FAD' : '#2563EB') : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'), color: isDarkMode ? 'white' : 'black' }}>
                미니멀
              </button>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black bg-opacity-20"
        />
      )}
    </>
  );
};
