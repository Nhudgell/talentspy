import React, { useEffect, useRef, useState } from 'react';
import { SCREENS } from '../hooks/useGameState';
import styles from './TitleScreen.module.css';

const TAGLINES = [
  'READ THE DATA. CRACK THE CASE.',
  'EVERY EMPLOYEE HIDES A STORY.',
  'THE TRUTH IS IN THE METRICS.',
  'YOU ARE THE PEOPLE DETECTIVE.',
];

export const TitleScreen = ({ setScreen, detectiveName, setDetectiveName }) => {
  const [tagline, setTagline] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => {
        setTagline(t => (t + 1) % TAGLINES.length);
        setGlitch(false);
      }, 150);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const canStart = detectiveName.trim().length >= 2;

  return (
    <div className={styles.container}>
      <div className={styles.grid} />
      
      <div className={styles.content}>
        <div className={styles.badge}>
          <span>🔍</span>
          <span>PEOPLE ANALYTICS DIVISION</span>
        </div>

        <h1 className={styles.title}>
          TALENT<br />
          <span className={styles.titleAccent}>SCOUT</span>
        </h1>

        <p className={`${styles.tagline} ${glitch ? styles.glitch : ''}`}>
          {TAGLINES[tagline]}
        </p>

        <p className={styles.subtitle}>
          You're a people analytics detective. Employee data is your magnifying glass.<br />
          Uncover who's about to quit, burn out, or break through — before it's too late.
        </p>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>DETECTIVE NAME</label>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Enter your name..."
            value={detectiveName}
            onChange={e => setDetectiveName(e.target.value)}
            maxLength={20}
            onKeyDown={e => e.key === 'Enter' && canStart && setScreen(SCREENS.CASE_SELECT)}
          />
        </div>

        <div className={styles.buttons}>
          <button
            className={`${styles.btnPrimary} ${!canStart ? styles.disabled : ''}`}
            onClick={() => canStart && setScreen(SCREENS.CASE_SELECT)}
            disabled={!canStart}
          >
            OPEN CASE FILES
          </button>
          <button
            className={styles.btnSecondary}
            onClick={() => setScreen(SCREENS.LEADERBOARD)}
          >
            LEADERBOARD
          </button>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}><span>6</span>Suspects</div>
          <div className={styles.stat}><span>3</span>Cases</div>
          <div className={styles.stat}><span>5</span>Data Types</div>
          <div className={styles.stat}><span>∞</span>Insight</div>
        </div>
      </div>

      <div className={styles.corner} data-pos="tl">■</div>
      <div className={styles.corner} data-pos="tr">■</div>
      <div className={styles.corner} data-pos="bl">■</div>
      <div className={styles.corner} data-pos="br">■</div>
    </div>
  );
};
