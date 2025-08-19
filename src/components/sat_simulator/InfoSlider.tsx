// src/components/sat_simulator/InfoSlider.tsx

import React, { useState, useRef, useEffect } from 'react';
import type { TestBlock } from '../../data/schedule';
import type { Lap } from '../../types/simulator';

// Props 인터페이스는 기존 형식을 그대로 유지합니다.
interface InfoSliderProps {
    block: TestBlock;
    remainingSeconds: number;
    virtualTime: string;
    stopwatch: number;
    currentLapTimes: Lap[];
    isWarningTime: boolean;
    onLapClick: () => void;
    isCustomizing: boolean;
    slideConfig: any; // { slide0: string, slide1: string, ... }
    setSlideConfig: (config: any) => void;
    tempLapInfo: { lapNumber: number; lapTime: number } | null;
    manualVirtualTime: string | null;
    setManualVirtualTime: (time: string | null) => void;
}

// JSX 파일의 formatTime 함수가 더 유연하므로 가져옵니다.
const formatTime = (totalSeconds: number): string => {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// --- Helper Components (JSX 파일의 구조를 TS로 변환) ---

// 1. 커스텀 정보 표시를 위한 작은 컴포넌트
const CustomInfoDisplay: React.FC<any> = ({ slot, block, remainingSeconds, virtualTime, stopwatch, currentLapTimes, manualVirtualTime }) => {
    let title = '', value = '';
    if (slot === 'blockName') {
        title = '교시 정보';
        value = block.name;
    } else if (slot === 'remainingTime') {
        title = '남은 시간';
        value = formatTime(remainingSeconds);
    } else if (slot === 'virtualTime') {
        title = '실제 수능 시간';
        value = block.isExam ? (manualVirtualTime || virtualTime) : "--:--:--";
    } else if (slot === 'stopwatch') {
        title = '스톱워치';
        value = formatTime(stopwatch).substring(3); // MM:SS
    } else if (slot === 'lapRecord') {
        title = '최근 랩 기록';
        value = currentLapTimes.length > 0
            ? `랩 ${currentLapTimes.length}: ${formatTime(currentLapTimes[currentLapTimes.length - 1].lap).substring(3)}`
            : '기록 없음';
    } else {
        return null;
    }
    return (
        <div className="custom-info-item">
            <span className="custom-info-title">{title}</span>
            <span className="custom-info-value">{value}</span>
        </div>
    );
};

// 2. 각 슬라이드의 내용을 렌더링하는 컴포넌트
const SlideContent: React.FC<any> = ({ index, block, remainingSeconds, virtualTime, stopwatch, currentLapTimes, isWarningTime, getBlockClass, manualVirtualTime, setManualVirtualTime }) => {
    
    const handleCurrentTimeClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // 부모의 onLapClick 이벤트 방지
        if (manualVirtualTime) {
            setManualVirtualTime(null); // 다시 원래 수능 시간으로 복귀
        } else {
            const now = new Date().toTimeString().split(' ')[0];
            setManualVirtualTime(now); // 현재 시간으로 설정
        }
    };

    switch (index) {
        case 0:
            return (
                <>
                    <h3>교시 정보</h3>
                    <div className={`content ${getBlockClass(block.type)}`}>{block.name}</div>
                </>
            );
        case 1:
            return (
                <>
                    <h3>남은 시간</h3>
                    <div className={`content countdown-content ${getBlockClass(block.type)}`}>{formatTime(remainingSeconds)}</div>
                </>
            );
        case 2:
            return (
                <>
                    <h3>{manualVirtualTime ? '현재 시간' : '수능 시간'}</h3>
                    <div className={`content ${getBlockClass(block.type)}`}>
                        {block.isExam ? (manualVirtualTime || virtualTime) : "시험 시간 아님"}
                    </div>
                    {block.isExam && (
                        <div className="time-sync-button" onClick={handleCurrentTimeClick}>
                           {manualVirtualTime ? `수능 시간: (${virtualTime})` : `현재 시간: (${new Date().toTimeString().split(' ')[0]})`}
                        </div>
                    )}
                </>
            );
        case 3:
            return (
                <>
                    <h3>스톱워치</h3>
                    <div className="content">{formatTime(stopwatch).substring(3)}</div>
                    <div className="lap-info">
                        {currentLapTimes.length > 0
                            ? `최근 기록 (랩 ${currentLapTimes.length}): ${formatTime(currentLapTimes[currentLapTimes.length - 1].lap).substring(3)}`
                            : '기록된 랩타임이 없습니다.'
                        }
                    </div>
                </>
            );
        default:
            return null;
    }
};

// --- Main Component ---

const InfoSlider: React.FC<InfoSliderProps> = ({
    block, remainingSeconds, virtualTime, stopwatch, currentLapTimes, isWarningTime, onLapClick,
    isCustomizing, slideConfig, setSlideConfig, tempLapInfo, manualVirtualTime, setManualVirtualTime
}) => {
    
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 4;
    const sliderRef = useRef<HTMLDivElement | null>(null);
    const touchStartRef = useRef<number>(0);
    const isDraggingRef = useRef<boolean>(false);

    const moveSlide = (direction: number) => {
        setCurrentSlide((prev) => (prev + direction + totalSlides) % totalSlides);
    };
    
    // 슬라이드 이동 애니메이션
    useEffect(() => {
        if (sliderRef.current && !isDraggingRef.current) {
            const viewportWidth = sliderRef.current.parentElement!.offsetWidth;
            sliderRef.current.style.transition = 'transform 0.4s ease-in-out';
            sliderRef.current.style.transform = `translateX(${-currentSlide * viewportWidth}px)`;
        }
    }, [currentSlide]);

    // --- Touch Event Handlers for Swiping ---
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        isDraggingRef.current = true;
        touchStartRef.current = e.touches[0].clientX;
        if(sliderRef.current) sliderRef.current.style.transition = 'none';
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current || !sliderRef.current) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartRef.current;
        const viewportWidth = sliderRef.current.parentElement!.offsetWidth;
        sliderRef.current.style.transform = `translateX(${-currentSlide * viewportWidth + diff}px)`;
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        isDraggingRef.current = false;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartRef.current;
        const threshold = 50;

        if (diff < -threshold) moveSlide(1);
        else if (diff > threshold) moveSlide(-1);
        else { // 원래 위치로 복귀
            if (sliderRef.current) {
                const viewportWidth = sliderRef.current.parentElement!.offsetWidth;
                sliderRef.current.style.transition = 'transform 0.4s ease-in-out';
                sliderRef.current.style.transform = `translateX(${-currentSlide * viewportWidth}px)`;
            }
        }
    };
    
    // 텍스트 색상 변경을 위한 클래스 반환 함수
    const getBlockClass = (type: string): string => {
        if (isWarningTime) return 'warning-text';
        if (type === 'break' || type === 'lunch') return 'break-text';
        if (type === 'admin' || type === 'prepare' || type === 'bell') return 'admin-text';
        return '';
    };

    const slideOptions = [
        { value: 'none', label: '표시 안함'},
        { value: 'blockName', label: '교시 정보' },
        { value: 'remainingTime', label: '남은 시간' },
        { value: 'virtualTime', label: '실제 수능 시간' },
        { value: 'stopwatch', label: '스톱워치' },
        { value: 'lapRecord', label: '최근 랩 기록' },
    ];
    
    return (
        <div className="slider-container">
            {/* 상단 오버레이 정보 */}
            <div className="custom-info-overlay">
                <CustomInfoDisplay slot={slideConfig[`slide${currentSlide}`]} {...{block, remainingSeconds, virtualTime, stopwatch, currentLapTimes, manualVirtualTime}} />
            </div>

            {/* 메인 슬라이더 */}
            <div className="slider-viewport">
                <div
                    className="slider-wrapper"
                    ref={sliderRef}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {[...Array(totalSlides)].map((_, index) => (
                        <div className="slide" key={index} onClick={onLapClick}>
                           <SlideContent 
                               index={index} 
                               getBlockClass={getBlockClass} 
                               {...{block, remainingSeconds, virtualTime, stopwatch, currentLapTimes, isWarningTime, manualVirtualTime, setManualVirtualTime, tempLapInfo}} 
                           />
                        </div>
                    ))}
                </div>
            </div>

            {/* 랩 기록 시 임시로 뜨는 알림 */}
            {tempLapInfo && (
                <div className="temp-lap-display">
                    랩 {tempLapInfo.lapNumber} 기록: {formatTime(tempLapInfo.lapTime).substring(3)}
                </div>
            )}

            {/* 좌우 이동 버튼 */}
            <div className="slider-nav">
                <button onClick={() => moveSlide(-1)}>&#10094;</button>
                <button onClick={() => moveSlide(1)}>&#10095;</button>
            </div>

            {/* 슬라이드 위치 표시 인디케이터 */}
            <div className="slider-indicator">
                {[...Array(totalSlides)].map((_, index) => (
                    <div
                        key={index}
                        className={`indicator-dot ${currentSlide === index ? 'active' : ''}`}
                    />
                ))}
            </div>

            {/* 커스터마이징 메뉴 */}
            {isCustomizing && (
                <div className="customization-menu">
                    <label>현재 슬라이드 정보:</label>
                    <select value={slideConfig[`slide${currentSlide}`]} onChange={e => setSlideConfig((prev: any) => ({...prev, [`slide${currentSlide}`]: e.target.value}))}>
                        {slideOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            )}
        </div>
    );
};

export default InfoSlider;