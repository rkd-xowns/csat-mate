import { useTheme } from '../contexts/ThemeContext';
import { useWhiteNoise } from '../contexts/WhiteNoiseContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const WHITE_NOISE_OPTIONS = [
  { value: 'none', label: '없음', emoji: '🔇' },
  { value: 'rain', label: '빗소리', emoji: '🌧️' },
  { value: 'ocean', label: '파도소리', emoji: '🌊' },
  { value: 'forest', label: '숲소리', emoji: '🌲' },
  { value: 'cafe', label: '카페소리', emoji: '☕' },
  { value: 'fire', label: '모닥불', emoji: '🔥' },
] as const;

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onToggle, onClose }) => {
  const { isDarkMode, toggleThemeMode, themeStyle, setThemeStyle } = useTheme();
  const { 
    isPlaying, 
    currentType, 
    volume, 
    isMuted, 
    setWhiteNoiseType, 
    setVolume, 
    togglePlayPause, 
    toggleMute 
  } = useWhiteNoise();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

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
        className={`fixed top-0 right-0 h-full z-40 p-6 transition-transform duration-300 ease-in-out overflow-y-auto`}
        style={{
          width: '320px',
          backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(248, 249, 250, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '-10px 0 20px rgba(0,0,0,0.2)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          paddingTop: `calc(env(safe-area-inset-top, 0px) + 1.5rem)`,
          paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 1.5rem)`,
        }}
      >
        <h3 className='text-xl font-bold mb-6' style={{ color: isDarkMode ? 'white' : 'black' }}>설정</h3>
        
        <div className="space-y-6">
          {/* 화이트노이즈 섹션 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className='font-medium' style={{color: isDarkMode ? 'white' : 'black'}}>
                배경음 {currentType !== 'none' && WHITE_NOISE_OPTIONS.find(opt => opt.value === currentType)?.emoji}
              </p>
              {currentType !== 'none' && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleMute}
                    className="p-1 rounded text-sm"
                    style={{ 
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      color: isDarkMode ? 'white' : 'black'
                    }}
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                  <button 
                    onClick={togglePlayPause}
                    className="p-1 rounded text-sm"
                    style={{ 
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      color: isDarkMode ? 'white' : 'black'
                    }}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {WHITE_NOISE_OPTIONS.map((option) => (
                <button 
                  key={option.value}
                  onClick={() => setWhiteNoiseType(option.value as any)}
                  className="p-2 rounded-lg text-sm flex items-center gap-2"
                  style={{ 
                    backgroundColor: currentType === option.value 
                      ? (isDarkMode ? '#8B5FAD' : '#2563EB') 
                      : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                    color: currentType === option.value ? 'white' : (isDarkMode ? 'white' : 'black')
                  }}
                >
                  <span>{option.emoji}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>

            {/* 볼륨 조절 */}
            {currentType !== 'none' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{color: isDarkMode ? 'white' : 'black'}}>
                    볼륨
                  </span>
                  <span className="text-xs" style={{color: isDarkMode ? '#ccc' : '#666'}}>
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${isDarkMode ? '#8B5FAD' : '#2563EB'} 0%, ${isDarkMode ? '#8B5FAD' : '#2563EB'} ${volume * 100}%, ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'} ${volume * 100}%, ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'} 100%)`
                  }}
                />
              </div>
            )}
          </div>

          {/* 기존 테마 설정 */}
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