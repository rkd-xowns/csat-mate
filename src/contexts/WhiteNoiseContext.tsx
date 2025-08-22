// src/contexts/WhiteNoiseContext.tsx
import { createContext, useState, useContext, useEffect, useRef, type ReactNode } from 'react';

// 화이트노이즈 타입 정의
type WhiteNoiseType = 'rain' | 'ocean' | 'forest' | 'cafe' | 'fire' | 'none';

interface WhiteNoiseContextType {
  isPlaying: boolean;
  currentType: WhiteNoiseType;
  volume: number;
  isMuted: boolean;
  setWhiteNoiseType: (type: WhiteNoiseType) => void;
  setVolume: (volume: number) => void;
  togglePlayPause: () => void;
  toggleMute: () => void;
  pauseForListening: () => void;
  resumeAfterListening: () => void;
}

const WhiteNoiseContext = createContext<WhiteNoiseContextType | undefined>(undefined);

// 화이트노이즈 오디오 파일 import (src/assets에서)
import rainSound from '../assets/whitenoise/rain.mp3';
import oceanSound from '../assets/whitenoise/ocean.mp3';
import forestSound from '../assets/whitenoise/forest.mp3';
import cafeSound from '../assets/whitenoise/cafe.mp3';
import fireSound from '../assets/whitenoise/fire.mp3';

const WHITE_NOISE_SOURCES = {
  rain: rainSound,
  ocean: oceanSound,
  forest: forestSound,
  cafe: cafeSound,
  fire: fireSound,
  none: ''
};

export function WhiteNoiseProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentType, setCurrentType] = useState<WhiteNoiseType>('none');
  const [volume, setVolumeState] = useState(0.3); // 기본 볼륨 30%
  const [isMuted, setIsMuted] = useState(false);
  const [wasPlayingBeforeListening, setWasPlayingBeforeListening] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 오디오 인스턴스 초기화
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true; // 무한 반복
    audioRef.current.preload = 'auto';
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 볼륨 및 음소거 상태 적용
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 화이트노이즈 타입 변경
  const setWhiteNoiseType = (type: WhiteNoiseType) => {
    if (audioRef.current) {
      const wasPlaying = !audioRef.current.paused;
      audioRef.current.pause();
      
      if (type !== 'none' && WHITE_NOISE_SOURCES[type]) {
        audioRef.current.src = WHITE_NOISE_SOURCES[type];
        if (wasPlaying || isPlaying) {
          audioRef.current.play().catch(err => {
            console.error('화이트노이즈 재생 실패:', err);
          });
          setIsPlaying(true);
        }
      } else {
        setIsPlaying(false);
      }
    }
    setCurrentType(type);
  };

  // 볼륨 설정
  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
  };

  // 재생/일시정지 토글
  const togglePlayPause = () => {
    if (!audioRef.current || currentType === 'none') return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error('화이트노이즈 재생 실패:', err);
      });
      setIsPlaying(true);
    }
  };

  // 음소거 토글
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // 영어 듣기를 위한 일시정지
  const pauseForListening = () => {
    if (audioRef.current && isPlaying) {
      setWasPlayingBeforeListening(true);
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // 영어 듣기 후 재개
  const resumeAfterListening = () => {
    if (audioRef.current && wasPlayingBeforeListening && currentType !== 'none') {
      audioRef.current.play().catch(err => {
        console.error('화이트노이즈 재개 실패:', err);
      });
      setIsPlaying(true);
      setWasPlayingBeforeListening(false);
    }
  };

  const value = {
    isPlaying,
    currentType,
    volume,
    isMuted,
    setWhiteNoiseType,
    setVolume,
    togglePlayPause,
    toggleMute,
    pauseForListening,
    resumeAfterListening,
  };

  return (
    <WhiteNoiseContext.Provider value={value}>
      {children}
    </WhiteNoiseContext.Provider>
  );
}

export function useWhiteNoise() {
  const context = useContext(WhiteNoiseContext);
  if (context === undefined) {
    throw new Error('useWhiteNoise must be used within a WhiteNoiseProvider');
  }
  return context;
}