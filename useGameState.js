import { useState, useCallback } from 'react';
import { generateEmployeePool, CASES } from '../data/gameData';

export const SCREENS = {
  TITLE: 'title',
  CASE_SELECT: 'case_select',
  BRIEFING: 'briefing',
  INVESTIGATION: 'investigation',
  VERDICT: 'verdict',
  RESULTS: 'results',
  LEADERBOARD: 'leaderboard',
};

const getStoredScores = () => {
  try {
    const stored = localStorage.getItem('talentScoutScores');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveScore = (entry) => {
  try {
    const scores = getStoredScores();
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('talentScoutScores', JSON.stringify(scores.slice(0, 10)));
  } catch {}
};

export const useGameState = () => {
  const [screen, setScreen] = useState(SCREENS.TITLE);
  const [selectedCase, setSelectedCase] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState(0);
  const [revealedClues, setRevealedClues] = useState({});
  const [playerVerdicts, setPlayerVerdicts] = useState({});
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [results, setResults] = useState(null);
  const [detectiveName, setDetectiveName] = useState('');
  const [leaderboard, setLeaderboard] = useState(getStoredScores());
  const [cluesUsed, setCluesUsed] = useState(0);
  const [selectedVerdict, setSelectedVerdict] = useState(null);

  const allEmployees = generateEmployeePool();

  const startCase = useCallback((caseData) => {
    const caseEmployees = allEmployees.filter(e => caseData.employeeIds.includes(e.id));
    setSelectedCase(caseData);
    setEmployees(caseEmployees);
    setCurrentEmployeeIndex(0);
    setRevealedClues({});
    setPlayerVerdicts({});
    setScore(0);
    setCluesUsed(0);
    setTimeLeft(caseData.timeLimit);
    setSelectedVerdict(null);
    setScreen(SCREENS.BRIEFING);
  }, []);

  const startInvestigation = useCallback(() => {
    setTimerActive(true);
    setScreen(SCREENS.INVESTIGATION);
  }, []);

  const revealClue = useCallback((employeeId, clueType) => {
    setRevealedClues(prev => {
      const empClues = prev[employeeId] || [];
      if (empClues.includes(clueType)) return prev;
      setCluesUsed(c => c + 1);
      return { ...prev, [employeeId]: [...empClues, clueType] };
    });
  }, []);

  const submitVerdict = useCallback((employeeId, verdictId) => {
    setPlayerVerdicts(prev => ({ ...prev, [employeeId]: verdictId }));
    setSelectedVerdict(null);
  }, []);

  const goToResults = useCallback(() => {
    setTimerActive(false);
    
    let totalScore = 0;
    const resultDetails = employees.map(emp => {
      const playerVerdict = playerVerdicts[emp.id];
      const correct = playerVerdict === emp.verdict;
      const empClues = revealedClues[emp.id] || [];
      
      if (correct) {
        const basePoints = selectedCase.scoringCriteria.perfect / employees.length;
        const clueDeduction = empClues.length * 25;
        const earned = Math.max(basePoints - clueDeduction, 100);
        totalScore += Math.round(earned);
      }
      
      return {
        employee: emp,
        playerVerdict,
        correct,
        cluesRevealed: empClues.length,
      };
    });

    const timeBonus = Math.floor(timeLeft * (selectedCase.scoringCriteria.timeBonus / selectedCase.timeLimit));
    totalScore += timeBonus;
    totalScore = Math.max(0, totalScore);

    const correctCount = resultDetails.filter(r => r.correct).length;
    const accuracy = Math.round((correctCount / employees.length) * 100);

    setScore(totalScore);
    setResults({ details: resultDetails, timeBonus, accuracy, correctCount });
    
    if (detectiveName) {
      saveScore({
        name: detectiveName,
        score: totalScore,
        caseId: selectedCase.id,
        caseTitle: selectedCase.title,
        accuracy,
        date: new Date().toISOString(),
      });
      setLeaderboard(getStoredScores());
    }

    setScreen(SCREENS.RESULTS);
  }, [employees, playerVerdicts, revealedClues, selectedCase, timeLeft, detectiveName]);

  const navigateTo = useCallback((s) => setScreen(s), []);

  return {
    screen, setScreen: navigateTo,
    selectedCase, employees,
    currentEmployeeIndex, setCurrentEmployeeIndex,
    revealedClues, revealClue,
    playerVerdicts, submitVerdict,
    score, timeLeft, setTimeLeft,
    timerActive, setTimerActive,
    results, detectiveName, setDetectiveName,
    leaderboard, cluesUsed,
    selectedVerdict, setSelectedVerdict,
    startCase, startInvestigation, goToResults,
    cases: CASES,
  };
};
