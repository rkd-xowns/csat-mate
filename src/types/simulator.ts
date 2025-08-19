// src/types/simulator.ts

export interface SelectedSubjects {
  korean: boolean;
  math: boolean;
  english: boolean;
  history: boolean;
  inquiry1: boolean;
  inquiry2: boolean;
}

export interface SimulatorSettings {
  startMode: 'immediate' | 'real-time';
  scheduleMode: 'full' | 'test'; // ## [추가] 시간 모드 타입 ##
  selectedSubjects: SelectedSubjects;
  includeBreaks: boolean;
  includeBells: boolean;
  listeningFile: string | null;
}

export interface Lap {
    lap: number;
    time: string;
}

export interface LapData {
    [subjectName: string]: Lap[];
}

export interface FinishData {
    data: LapData;
    status: 'completed' | 'aborted';
}