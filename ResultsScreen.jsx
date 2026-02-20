import React from 'react';
import { VERDICT_OPTIONS } from '../data/gameData';
import { SCREENS } from '../hooks/useGameState';
import styles from './ResultsScreen.module.css';

export const ResultsScreen = ({ results, score, selectedCase, detectiveName, setScreen, cases, startCase }) => {
  if (!results) return null;

  const getRating = (accuracy) => {
    if (accuracy === 100) return { label: 'MASTER DETECTIVE', color: '#f5c842', stars: '★★★★★' };
    if (accuracy >= 75) return { label: 'SENIOR DETECTIVE', color: '#00d4aa', stars: '★★★★☆' };
    if (accuracy >= 50) return { label: 'FIELD AGENT', color: '#4488ff', stars: '★★★☆☆' };
    if (accuracy >= 25) return { label: 'TRAINEE', color: '#ff8c00', stars: '★★☆☆☆' };
    return { label: 'BACK TO TRAINING', color: '#ff4444', stars: '★☆☆☆☆' };
  };

  const rating = getRating(results.accuracy);

  const getVerdictInfo = (id) => VERDICT_OPTIONS.find(v => v.id === id);

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.caseTag}>CASE CLOSED — {selectedCase.title.toUpperCase()}</div>
          <h1 className={styles.title}>CASE REPORT</h1>
        </div>

        {/* Score hero */}
        <div className={styles.scoreHero}>
          <div className={styles.scoreLeft}>
            <div className={styles.detName}>{detectiveName}</div>
            <div className={styles.ratingStars}>{rating.stars}</div>
            <div className={styles.ratingLabel} style={{ color: rating.color }}>
              {rating.label}
            </div>
          </div>
          <div className={styles.scoreRight}>
            <div className={styles.scoreLabel}>TOTAL SCORE</div>
            <div className={styles.scoreVal}>{score.toLocaleString()}</div>
            <div className={styles.scoreSub}>
              Accuracy: {results.accuracy}% &nbsp;·&nbsp; Time bonus: +{results.timeBonus}
            </div>
          </div>
        </div>

        {/* Results breakdown */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>VERDICT BREAKDOWN</div>
          <div className={styles.verdictList}>
            {results.details.map(({ employee, playerVerdict, correct, cluesRevealed }) => {
              const playerInfo = getVerdictInfo(playerVerdict);
              const correctInfo = getVerdictInfo(employee.verdict);
              return (
                <div
                  key={employee.id}
                  className={`${styles.verdictRow} ${correct ? styles.correct : styles.wrong}`}
                >
                  <div className={styles.vrLeft}>
                    <span className={styles.vrAvatar}>{employee.avatar}</span>
                    <div>
                      <div className={styles.vrName}>{employee.name}</div>
                      <div className={styles.vrRole}>{employee.role}</div>
                    </div>
                  </div>
                  <div className={styles.vrCenter}>
                    <div className={styles.vrLabel}>Your verdict</div>
                    <div className={styles.vrVerdict} style={{ color: playerInfo?.color || '#888' }}>
                      {playerInfo?.label || '— NONE FILED —'}
                    </div>
                  </div>
                  {!correct && (
                    <div className={styles.vrCenter}>
                      <div className={styles.vrLabel}>Actual</div>
                      <div className={styles.vrVerdict} style={{ color: correctInfo?.color }}>
                        {correctInfo?.label}
                      </div>
                    </div>
                  )}
                  <div className={styles.vrRight}>
                    <div className={`${styles.vrResult} ${correct ? styles.vrCorrect : styles.vrWrong}`}>
                      {correct ? '✓ CORRECT' : '✗ WRONG'}
                    </div>
                    <div className={styles.vrClues}>{cluesRevealed} clues used</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanations */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>DETECTIVE DEBRIEF</div>
          {results.details.map(({ employee }) => (
            <div key={employee.id} className={styles.debrief}>
              <div className={styles.debriefHeader}>
                {employee.avatar} {employee.name}
              </div>
              <p className={styles.debriefBody}>{employee.explanation}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={() => setScreen(SCREENS.LEADERBOARD)}>
            VIEW LEADERBOARD
          </button>
          <button className={styles.btnSecondary} onClick={() => setScreen(SCREENS.CASE_SELECT)}>
            NEW CASE
          </button>
          <button className={styles.btnPrimary} onClick={() => startCase(selectedCase)}>
            RETRY CASE
          </button>
        </div>
      </div>
    </div>
  );
};
