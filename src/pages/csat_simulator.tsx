// src/pages/csat_simulator.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import InfoSlider from '../components/sat_simulator/InfoSlider';
import SimulationLoader from '../components/sat_simulator/SimulationLoader';
import MuteButton from '../components/sat_simulator/MuteButton';
import { useWhiteNoise } from '../contexts/WhiteNoiseContext';
import { buildTestQueue } from '../data/schedule';
import type { TestBlock } from '../data/schedule';
import type { SimulatorSettings, LapData, Lap, FinishData } from '../types/simulator';

// 오디오 파일 import
import preliminarySound from '../assets/preliminary_bell.mp3';
import prepareSound from '../assets/prepare_bell.mp3';
import examStartSound from '../assets/exam_start.mp3';
import examWarningSound from '../assets/exam_warning.mp3';
import examEndSound from '../assets/exam_end.mp3';
import englishPrepareSound from '../assets/english_prepare_sound.mp3';
import fourthPeriodWarningSound from '../assets/fourth_period_warning.mp3';

// --- Helper Functions ---
const audioPlayer = new Audio();
const playAudio = (audioSrc: string) => {
    if (audioSrc) {
        audioPlayer.src = audioSrc;
        audioPlayer.play().catch(e => console.error("오디오 재생 오류:", e));
    }
};
const stopAudio = () => {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
};

const getTargetTime = (timeString: string): Date => {
    const target = new Date();
    const [h, m, s] = timeString.split(':').map(Number);
    target.setHours(h, m, s, 0);
    return target;
};

const findNextUpcomingBlockIndex = (queue: TestBlock[]): number => {
    const now = new Date();
    for (let i = 0; i < queue.length; i++) {
        const block = queue[i];
        if (block.startTime && getTargetTime(block.startTime) > now) {
            return i;
        }
    }
    return -1;
};

const showNotification = (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, options);
        });
    }
};

const triggerVibration = (pattern: VibratePattern = 100) => {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
};

// --- Component ---
interface TestPageProps {
  settings: SimulatorSettings;
  onFinish: (result: FinishData) => void;
}

const TestPage: React.FC<TestPageProps> = ({ settings, onFinish }) => {
    const testQueue = useMemo(() => buildTestQueue(settings), [settings]);
    const initialIndex = useMemo(() => settings.startMode === 'real-time' ? findNextUpcomingBlockIndex(testQueue) : 0, [testQueue, settings.startMode]);

    // 화이트노이즈 훅 사용
    const { pauseForListening, resumeAfterListening } = useWhiteNoise();

    const [simState, setSimState] = useState<'PREPARING' | 'WAITING' | 'RUNNING' | 'FINISHED'>('PREPARING'); 
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [currentBlock, setCurrentBlock] = useState<TestBlock | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    
    const blockEndTimeRef = useRef<number | null>(null);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);
    const listeningFilePlayedRef = useRef(false);
    const isListeningPlayingRef = useRef(false); // 영어 듣기 재생 상태 추적

    const [waitingMessage, setWaitingMessage] = useState("시뮬레이션을 준비 중입니다...");
    const [timeOffset, setTimeOffset] = useState<number | null>(null);
    const [virtualTime, setVirtualTime] = useState("");
    const [stopwatch, setStopwatch] = useState(0);
    const [lapData, setLapData] = useState<LapData>({});
    const [currentLapTimes, setCurrentLapTimes] = useState<Lap[]>([]);
    const [isWarningTime, setIsWarningTime] = useState(false);
    const [isUiHidden, setIsUiHidden] = useState(false);
    const [isStartEnabled, setIsStartEnabled] = useState(false);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [slideConfig, setSlideConfig] = useState(() => {
      const savedConfig = localStorage.getItem('slideConfig');
      return savedConfig ? JSON.parse(savedConfig) : { slide0: 'blockName', slide1: 'remainingTime', slide2: 'virtualTime', slide3: 'stopwatch' };
    });
    const [manualVirtualTime, setManualVirtualTime] = useState<string | null>(null);
    const [tempLapInfo, setTempLapInfo] = useState<{lapNumber: number, lapTime: number} | null>(null);
    
    const startBlock = useCallback((block: TestBlock) => {
        if (!block) return;
        
        blockEndTimeRef.current = Date.now() + block.duration * 1000;
        listeningFilePlayedRef.current = false;
        isListeningPlayingRef.current = false;
        
        setCurrentBlock(block);
        setRemainingSeconds(block.duration);
        setStopwatch(0);
        setIsWarningTime(false);
        setManualVirtualTime(null);
        setCurrentLapTimes([]);
        
        if (block.isExam && block.startTime) {
            setTimeOffset(getTargetTime(block.startTime).getTime() - Date.now());
        } else {
            setTimeOffset(null);
        }
        setSimState('RUNNING');
    }, []);

    const finishBlock = useCallback(() => {
        const nextIndex = currentIndex + 1;
        
        // 영어 듣기가 끝났을 때 화이트노이즈 재개
        if (isListeningPlayingRef.current) {
            resumeAfterListening();
            isListeningPlayingRef.current = false;
        }
        
        setLapData(prev => {
            if (!currentBlock || !currentBlock.isExam) return prev;
            const finalLaps = [...currentLapTimes, { lap: stopwatch, time: virtualTime }].filter(item => item.lap > 0);
            return { ...prev, [currentBlock.name]: finalLaps };
        });
        
        if (nextIndex >= testQueue.length) {
            setSimState('FINISHED');
        } else {
            setCurrentIndex(nextIndex);
            if (settings.startMode === 'immediate') {
                startBlock(testQueue[nextIndex]);
            } else {
                setSimState('WAITING');
            }
        }
    }, [currentIndex, currentBlock, currentLapTimes, stopwatch, virtualTime, testQueue, settings.startMode, startBlock, resumeAfterListening]);
    
    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        audioPlayer.muted = isMuted;
    }, [isMuted]);
    
    useEffect(() => {
        const manageWakeLock = async () => {
            if (simState === 'RUNNING') {
                if ('wakeLock' in navigator && !wakeLockRef.current) {
                    try {
                        wakeLockRef.current = await navigator.wakeLock.request('screen');
                    } catch (err) { console.error('Wake Lock request failed:', err); }
                }
            } else {
                if (wakeLockRef.current) {
                    wakeLockRef.current.release().then(() => { wakeLockRef.current = null; });
                }
            }
        };
        manageWakeLock();
    }, [simState]);

    useEffect(() => {
        if (simState === 'FINISHED') {
            console.log("✅ TestPage: 시뮬레이션 종료! onFinish를 호출합니다.", { data: lapData, status: 'completed' });
            onFinish({ data: lapData, status: 'completed' });
            return;
        }
        
        if (simState === 'PREPARING') {
            if (settings.startMode === 'real-time' && initialIndex === -1) {
                setSimState('FINISHED');
            } else if (settings.startMode === 'immediate') {
                setTimeout(() => setIsStartEnabled(true), 3000);
            } else {
                setSimState('WAITING');
            }
            return;
        }

        const intervalId = setInterval(() => {
            if (simState === 'WAITING') {
                if (currentIndex === -1) {
                    setSimState('FINISHED');
                    return;
                }
                const nextBlock = testQueue[currentIndex];
                const diff = nextBlock.startTime ? getTargetTime(nextBlock.startTime).getTime() - Date.now() : -1;
                
                if (diff <= 0) {
                    startBlock(nextBlock);
                } else {
                    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
                    const m = String(Math.floor((diff / 60000) % 60)).padStart(2, '0');
                    const s = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
                    setWaitingMessage(`${h}:${m}:${s}`);
                }
            } else if (simState === 'RUNNING' && blockEndTimeRef.current && currentBlock) {
                const newRemaining = Math.max(0, Math.round((blockEndTimeRef.current - Date.now()) / 1000));
                
                // 블록이 시작되는 첫 순간(duration과 남은 시간이 같을 때)에만 시작음 재생
                if (newRemaining === currentBlock.duration && !isMuted) {
                    const { key, type } = currentBlock;
                    if (key === 'english' && settings.listeningFile && !settings.includeBells) {
                        // 영어 듣기 시작 시 화이트노이즈 일시정지
                        pauseForListening();
                        isListeningPlayingRef.current = true;
                        playAudio(settings.listeningFile);
                    } else if (key === 'english_prepare') playAudio(englishPrepareSound);
                    else if (type === 'bell') playAudio(preliminarySound);
                    else if (type === 'prepare') playAudio(prepareSound);
                    else if (type === 'exam' && !(key === 'english' && settings.listeningFile)) {
                        playAudio(examStartSound);
                    }
                }
                
                // 듣기 파일 재생 (준비령 ON + 남은 시간 180초)
                if (currentBlock.key === 'english_prepare' && newRemaining <= 180 && settings.listeningFile && !listeningFilePlayedRef.current) {
                    // 영어 듣기 시작 시 화이트노이즈 일시정지
                    pauseForListening();
                    isListeningPlayingRef.current = true;
                    if (!isMuted) playAudio(settings.listeningFile);
                    listeningFilePlayedRef.current = true;
                }
                
                // 경고음 재생
                const isFourth = ['history', 'inquiry1', 'inquiry2'].includes(currentBlock.key);
                const warningTime = isFourth ? 300 : 600;
                if (currentBlock.isExam && newRemaining === warningTime && !isWarningTime) {
                    setIsWarningTime(true);
                    if (!isMuted) playAudio(isFourth ? fourthPeriodWarningSound : examWarningSound);
                    showNotification(`${currentBlock.name} 종료 ${warningTime/60}분 전`, { body: `시험 종료까지 ${warningTime/60}분 남았습니다.`, icon: '/icons/192.png', tag: `${currentBlock.key}-warning` });
                    triggerVibration([100, 50, 100]);
                }
                
                // 종료음 재생 및 다음 블록으로
                if (newRemaining <= 0) {
                    if (!isMuted && currentBlock.isExam) playAudio(examEndSound);
                    showNotification(`${currentBlock.name} 종료`, { body: "시험 시간이 종료되었습니다.", icon: '/icons/192.png', tag: currentBlock.key });
                    triggerVibration([200, 100, 200, 100, 200]);
                    finishBlock();
                }

                setRemainingSeconds(newRemaining);
                if (currentBlock.isExam) setStopwatch(prev => prev + 1);
                if (timeOffset !== null) setVirtualTime(new Date(Date.now() + timeOffset).toTimeString().split(' ')[0]);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [simState, currentIndex, timeOffset, isMuted, isWarningTime, lapData, onFinish, startBlock, finishBlock, testQueue, currentBlock, settings, pauseForListening]);
    
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && simState === 'RUNNING' && blockEndTimeRef.current && currentBlock) {
                const newRemaining = Math.max(0, Math.round((blockEndTimeRef.current - Date.now()) / 1000));
                const elapsedSeconds = remainingSeconds - newRemaining;
                setRemainingSeconds(newRemaining);
                if (currentBlock.isExam) {
                    setStopwatch(prev => prev + elapsedSeconds);
                }
                if (newRemaining <= 0) {
                    finishBlock();
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [simState, currentBlock, remainingSeconds, finishBlock]);

    const handleAbort = () => {
        if (window.confirm("정말로 시뮬레이션을 중단하시겠습니까?")) {
            stopAudio();
            
            // 영어 듣기 중이었다면 화이트노이즈 재개
            if (isListeningPlayingRef.current) {
                resumeAfterListening();
                isListeningPlayingRef.current = false;
            }
            
            let finalData = lapData;
            if (currentBlock && currentBlock.isExam) {
                const finalLaps = [...currentLapTimes, { lap: stopwatch, time: virtualTime }].filter(item => item.lap > 0);
                finalData = { ...lapData, [currentBlock.name]: finalLaps };
            }
            onFinish({ data: finalData, status: 'aborted' });
            setSimState('FINISHED');
        }
    };

    const handleLap = useCallback(() => {
        if (currentBlock?.isExam) {
            triggerVibration(); 
            const newLap = { lap: stopwatch, time: virtualTime };
            setCurrentLapTimes(prev => [...prev, newLap]);
            setTempLapInfo({ lapNumber: currentLapTimes.length + 1, lapTime: stopwatch });
            setTimeout(() => setTempLapInfo(null), 5000);
            setStopwatch(0);
        }
    }, [currentBlock, stopwatch, virtualTime, currentLapTimes.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') { e.preventDefault(); handleLap(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleLap]);

    if (simState !== 'RUNNING') {
        let mode: 'loading' | 'realtime-waiting' | 'tests-finished' = 'loading';
        if (simState === 'FINISHED' || (settings.startMode === 'real-time' && initialIndex === -1)) {
            mode = 'tests-finished';
        } else if (settings.startMode === 'real-time') {
            mode = 'realtime-waiting';
        }

        return (
            <SimulationLoader 
                mode={mode}
                isStartEnabled={isStartEnabled}
                onStart={() => startBlock(testQueue[0])}
                onAbort={handleAbort}
                waitingMessage={waitingMessage}
                nextTestName={testQueue[currentIndex]?.name}
            />
        );
    }
    
    if (!currentBlock) return null;

    return (
        <div className={`page-layout flex flex-col items-center justify-center p-4 ${isUiHidden ? 'ui-hidden' : ''}`}>
             <button onClick={() => setIsUiHidden(prev => !prev)} className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-500 bg-opacity-30 text-2xl">
                {isUiHidden ? '👁️' : '🙈'}
            </button>
            <div className="w-full max-w-2xl absolute top-4 left-1/2 -translate-x-1/2 flex justify-between items-center px-4">
                <h2 className="text-lg font-bold text-white">시뮬레이션 진행 중</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsCustomizing(prev => !prev)} className="secondary-button">
                        {isCustomizing ? '완료' : '커스텀'}
                    </button>
                    <button onClick={handleAbort} className="secondary-button">중단</button>
                    <MuteButton isMuted={isMuted} onToggle={() => setIsMuted(prev => !prev)} />
                </div>
            </div>
            <InfoSlider
                block={currentBlock}
                remainingSeconds={remainingSeconds}
                virtualTime={virtualTime}
                stopwatch={stopwatch}
                currentLapTimes={currentLapTimes}
                isWarningTime={isWarningTime}
                onLapClick={handleLap}
                isCustomizing={isCustomizing}
                slideConfig={slideConfig}
                setSlideConfig={setSlideConfig}
                tempLapInfo={tempLapInfo}
                manualVirtualTime={manualVirtualTime}
                setManualVirtualTime={setManualVirtualTime}
            />
        </div>
    );
};

export default TestPage;