// src/data/schedule.ts

import type { SimulatorSettings, SelectedSubjects } from '../types/simulator';

export interface TestBlock {
  key: string;
  name: string;
  type: 'admin' | 'bell' | 'prepare' | 'exam' | 'break';
  duration: number; // seconds
  isExam: boolean;
  startTime?: string; // HH:MM:SS
}

const FULL_DATA: Record<string, Omit<TestBlock, 'key'>> = {
    korean:   { name: "1교시 국어",     type: 'exam', duration: 80 * 60, isExam: true, startTime: "08:40:00" },
    math:     { name: "2교시 수학",     type: 'exam', duration: 100 * 60, isExam: true, startTime: "10:30:00" },
    english:  { name: "3교시 영어",     type: 'exam', duration: 70 * 60, isExam: true, startTime: "13:10:00" },
    history:  { name: "4교시 한국사",   type: 'exam', duration: 30 * 60, isExam: true, startTime: "14:50:00" },
    inquiry1: { name: "4교시 탐구1",    type: 'exam', duration: 30 * 60, isExam: true, startTime: "15:35:00" },
    inquiry2: { name: "4교시 탐구2",    type: 'exam', duration: 30 * 60, isExam: true, startTime: "16:07:00" },
    prepare_all:       { name: "입실 및 준비",    type: 'admin',   duration: 30 * 60, isExam: false, startTime: "08:10:00" },
    korean_preliminary:{ name: "1교시 예비령",    type: 'bell',    duration: 5 * 60,  isExam: false, startTime: "08:25:00" },
    korean_prepare:    { name: "1교시 준비령",    type: 'prepare', duration: 5 * 60,  isExam: false, startTime: "08:35:00" },
    break_1:           { name: "쉬는 시간",       type: 'break',   duration: 30 * 60, isExam: false, startTime: "10:00:00" },
    math_preliminary:  { name: "2교시 예비령",    type: 'bell',    duration: 5 * 60,  isExam: false, startTime: "10:20:00" },
    math_prepare:      { name: "2교시 준비령",    type: 'prepare', duration: 5 * 60,  isExam: false, startTime: "10:25:00" },
    lunch:             { name: "점심 시간",       type: 'break',   duration: 60 * 60, isExam: false, startTime: "12:10:00" },
    english_preliminary:{ name: "3교시 예비령",    type: 'bell',    duration: 5 * 60,  isExam: false, startTime: "13:00:00" },
    english_prepare:   { name: "3교시 준비(듣기)", type: 'prepare', duration: 5 * 60,  isExam: false, startTime: "13:05:00" },
    break_2:           { name: "쉬는 시간",       type: 'break',   duration: 20 * 60, isExam: false, startTime: "14:20:00" },
    history_preliminary:{ name: "4교시 예비령",    type: 'bell',    duration: 10 * 60, isExam: false, startTime: "14:40:00" },
    history_prepare:   { name: "4교시 준비",      type: 'prepare', duration: 5 * 60,  isExam: false, startTime: "14:55:00" },
    collect_history:   { name: "한국사 문제지 회수", type: 'admin', duration: 15 * 60, isExam: false, startTime: "15:20:00" },
    inquiry_prepare:   { name: "탐구1 준비",      type: 'admin',   duration: 10 * 60, isExam: false, startTime: "15:25:00" },
    collect_inquiry1:  { name: "탐구1 문제지 회수", type: 'admin', duration: 2 * 60,  isExam: false, startTime: "16:05:00" },
};

const TEST_DATA: Record<string, Omit<TestBlock, 'key'>> = {
    korean:   { name: "1교시 국어",     type: 'exam', duration: 60, isExam: true, startTime: "08:40:00" },
    math:     { name: "2교시 수학",     type: 'exam', duration: 60, isExam: true, startTime: "10:30:00" },
    english:  { name: "3교시 영어",     type: 'exam', duration: 60, isExam: true, startTime: "13:10:00" },
    history:  { name: "4교시 한국사",   type: 'exam', duration: 30, isExam: true, startTime: "14:50:00" },
    inquiry1: { name: "4교시 탐구1",    type: 'exam', duration: 30, isExam: true, startTime: "15:35:00" },
    inquiry2: { name: "4교시 탐구2",    type: 'exam', duration: 30, isExam: true, startTime: "16:07:00" },
    prepare_all:       { name: "입실 및 준비",    type: 'admin',   duration: 30,    isExam: false, startTime: "08:10:00" },
    korean_preliminary:{ name: "1교시 예비령",    type: 'bell',    duration: 15,    isExam: false, startTime: "08:25:00" },
    korean_prepare:    { name: "1교시 준비령",    type: 'prepare', duration: 15,    isExam: false, startTime: "08:35:00" },
    break_1:           { name: "쉬는 시간",       type: 'break',   duration: 20,    isExam: false, startTime: "10:00:00" },
    math_preliminary:  { name: "2교시 예비령",    type: 'bell',    duration: 15,    isExam: false, startTime: "10:20:00" },
    math_prepare:      { name: "2교시 준비령",    type: 'prepare', duration: 15,    isExam: false, startTime: "10:25:00" },
    lunch:             { name: "점심 시간",       type: 'break',   duration: 30,    isExam: false, startTime: "12:10:00" },
    english_preliminary:{ name: "3교시 예비령",    type: 'bell',    duration: 15,    isExam: false, startTime: "13:00:00" },
    english_prepare:   { name: "3교시 준비(듣기)", type: 'prepare', duration: 185,   isExam: false, startTime: "13:05:00" },
    break_2:           { name: "쉬는 시간",       type: 'break',   duration: 20,    isExam: false, startTime: "14:20:00" },
    history_preliminary:{ name: "4교시 예비령",    type: 'bell',    duration: 15,    isExam: false, startTime: "14:45:00" },
    history_prepare:   { name: "4교시 준비",      type: 'prepare', duration: 15,    isExam: false, startTime: "14:55:00" },
    collect_history:   { name: "한국사 문제지 회수", type: 'admin', duration: 15, isExam: false, startTime: "15:20:00" },
    inquiry_prepare:   { name: "탐구1 준비",      type: 'admin',   duration: 15,    isExam: false, startTime: "15:30:00" },
    collect_inquiry1:  { name: "탐구1 문제지 회수", type: 'admin', duration: 15, isExam: false, startTime: "16:05:00" },
};

export const EXAM_SUBJECTS_DATA = FULL_DATA;

export const buildTestQueue = (settings: SimulatorSettings): TestBlock[] => {
    const { selectedSubjects, includeBreaks, includeBells, scheduleMode } = settings;
    const queue: TestBlock[] = [];
    
    const DATA = scheduleMode === 'full' ? FULL_DATA : TEST_DATA;

    const addBlock = (key: keyof typeof DATA) => {
        if (DATA[key]) {
            queue.push({ key, ...(DATA[key] as Omit<TestBlock, 'key'>) });
        }
    };
    
    // ## [수정] subjectOrder 변수를 사용하도록 forEach문을 원래대로 복구 ##
    const subjectOrder: (keyof SelectedSubjects)[] = ['korean', 'math', 'english', 'history', 'inquiry1', 'inquiry2'];
    
    if (includeBells) addBlock('prepare_all');

    subjectOrder.forEach((subjectKey, index) => {
        if (selectedSubjects[subjectKey]) {
            if (includeBells) {
                if (DATA[`${subjectKey}_preliminary`]) addBlock(`${subjectKey}_preliminary`);
                if (DATA[`${subjectKey}_prepare`]) addBlock(`${subjectKey}_prepare`);
            }
            addBlock(subjectKey);

            if (includeBreaks) {
                const nextSubjectKey = subjectOrder[index + 1];
                if (nextSubjectKey && selectedSubjects[nextSubjectKey]) {
                    if (subjectKey === 'korean') addBlock('break_1');
                    else if (subjectKey === 'math') addBlock('lunch');
                    else if (subjectKey === 'english') addBlock('break_2');
                    else if (subjectKey === 'history') addBlock('collect_history');
                    else if (subjectKey === 'inquiry1') addBlock('collect_inquiry1');
                }
            }
        }
    });

    return queue;
};