import React, { useEffect, useCallback } from 'react';
import styles from './InvestigationScreen.module.css';
import { CLUE_DESCRIPTIONS, VERDICT_OPTIONS } from '../data/gameData';

const formatClueValue = (key, value) => {
  if (typeof value === 'boolean') return value ? '✓ YES' : '✗ NO';
  if (key === 'market_rate_gap') {
    const positive = value.startsWith('+');
    return <span style={{ color: positive ? '#ff6b35' : '#00d4aa' }}>{value}</span>;
  }
  if (key === 'linkedin_activity') {
    const color = value === 'very high' ? '#ff4444' : value === 'high' ? '#ff8c00' : '#8888aa';
    return <span style={{ color }}>{value.toUpperCase()}</span>;
  }
  return String(value).toUpperCase();
};

const ClueCard = ({ category, data, revealed, onReveal }) => {
  const info = CLUE_DESCRIPTIONS[category];

  if (!revealed) {
    return (
      <button className={styles.clueBtn} onClick={() => onReveal(category)}>
        <span className={styles.clueIcon}>{info.icon}</span>
        <div className={styles.clueInfo}>
          <div className={styles.clueName}>{info.label}</div>
          <div className={styles.clueHint}>{info.description}</div>
        </div>
        <span className={styles.clueLock}>REVEAL →</span>
      </button>
    );
  }

  return (
    <div className={styles.clueRevealed}>
      <div className={styles.clueRevealedHeader}>
        <span>{info.icon}</span>
        <span className={styles.clueName}>{info.label}</span>
        <span className={styles.clueOpenBadge}>REVIEWED</span>
      </div>
      <div className={styles.clueData}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className={styles.clueDatum}>
            <span className={styles.clueKey}>{key.replace(/_/g, ' ')}</span>
            <span className={styles.clueVal}>{formatClueValue(key, value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const InvestigationScreen = ({
  employees,
  currentEmployeeIndex,
  setCurrentEmployeeIndex,
  revealedClues,
  revealClue,
  playerVerdicts,
  submitVerdict,
  selectedVerdict,
  setSelectedVerdict,
  timeLeft,
  setTimeLeft,
  setTimerActive,
  goToResults,
  cluesUsed,
}) => {
  const employee = employees[currentEmployeeIndex];
  const empClues = revealedClues[employee?.id] || [];
  const hasVerdict = !!playerVerdicts[employee?.id];
  const allVerdicted = employees.every(e => playerVerdicts[e.id]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      goToResults();
      return;
    }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, goToResults, setTimeLeft]);

  const handleRevealClue = useCallback((clueType) => {
    revealClue(employee.id, clueType);
  }, [employee, revealClue]);

  const handleVerdictSubmit = useCallback(() => {
    if (selectedVerdict) {
      submitVerdict(employee.id, selectedVerdict);
    }
  }, [selectedVerdict, employee, submitVerdict]);

  const timerDanger = timeLeft < 20;
  const timerWarning = timeLeft < 60;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!employee) return null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <div className={styles.topLabel}>ACTIVE INVESTIGATION</div>
          <div className={styles.cluesUsed}>
            Clues Revealed: <strong>{cluesUsed}</strong>
          </div>
        </div>
        <div
          className={`${styles.timer} ${timerDanger ? styles.danger : timerWarning ? styles.warning : ''}`}
        >
          <div className={styles.timerLabel}>TIME REMAINING</div>
          <div className={styles.timerVal}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
        {allVerdicted && (
          <button className={styles.finishBtn} onClick={goToResults}>
            SUBMIT CASE →
          </button>
        )}
      </div>

      <div className={styles.layout}>
        {/* Suspect tabs */}
        <div className={styles.sidebar}>
          <p className={styles.sideLabel}>PERSONS OF INTEREST</p>
          {employees.map((emp, i) => (
            <button
              key={emp.id}
              className={`${styles.suspectTab} ${i === currentEmployeeIndex ? styles.activeTab : ''} ${playerVerdicts[emp.id] ? styles.verdictedTab : ''}`}
              onClick={() => setCurrentEmployeeIndex(i)}
            >
              <span className={styles.tabAvatar}>{emp.avatar}</span>
              <div className={styles.tabInfo}>
                <div className={styles.tabName}>{emp.name}</div>
                <div className={styles.tabRole}>{emp.role}</div>
              </div>
              {playerVerdicts[emp.id] ? (
                <span className={styles.tabCheck}>✓</span>
              ) : (
                <span className={styles.tabNum}>{i + 1}</span>
              )}
            </button>
          ))}

          <div className={styles.progress}>
            <div className={styles.progressLabel}>
              VERDICTS: {Object.keys(playerVerdicts).length}/{employees.length}
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(Object.keys(playerVerdicts).length / employees.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className={styles.main}>
          {/* Employee header */}
          <div className={styles.empHeader}>
            <div className={styles.empAvatar}>{employee.avatar}</div>
            <div>
              <div className={styles.empId}>{employee.id}</div>
              <h2 className={styles.empName}>{employee.name}</h2>
              <div className={styles.empMeta}>
                {employee.role} &nbsp;·&nbsp; {employee.department} &nbsp;·&nbsp; {employee.tenure} yrs tenure
              </div>
            </div>
            {hasVerdict && (
              <div className={styles.verdictedBadge}>
                ✓ VERDICT FILED
              </div>
            )}
          </div>

          {/* Clue files */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>DATA FILES</span>
              <span className={styles.sectionCount}>{empClues.length}/5 opened</span>
            </div>
            <div className={styles.clueGrid}>
              {Object.keys(employee.clues).map(cat => (
                <ClueCard
                  key={cat}
                  category={cat}
                  data={employee.clues[cat]}
                  revealed={empClues.includes(cat)}
                  onReveal={handleRevealClue}
                />
              ))}
            </div>
          </div>

          {/* Verdict section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>YOUR VERDICT</span>
              {hasVerdict && <span className={styles.sectionCount}>FILED — click to change</span>}
            </div>
            <div className={styles.verdictGrid}>
              {VERDICT_OPTIONS.map(v => (
                <button
                  key={v.id}
                  className={`${styles.verdictBtn} ${selectedVerdict === v.id ? styles.selectedVerdict : ''} ${playerVerdicts[employee.id] === v.id ? styles.filedVerdict : ''}`}
                  style={{ '--v-color': v.color }}
                  onClick={() => setSelectedVerdict(selectedVerdict === v.id ? null : v.id)}
                >
                  <span className={styles.verdictLabel}>{v.label}</span>
                  <span className={styles.verdictDesc}>{v.description}</span>
                </button>
              ))}
            </div>
            {selectedVerdict && (
              <button className={styles.submitVerdict} onClick={handleVerdictSubmit}>
                FILE VERDICT →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
