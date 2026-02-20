import React from 'react';
import './App.css';
import { useGameState, SCREENS } from './hooks/useGameState';
import { TitleScreen } from './components/TitleScreen';
import { CaseSelectScreen } from './components/CaseSelectScreen';
import { BriefingScreen } from './components/BriefingScreen';
import { InvestigationScreen } from './components/InvestigationScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';

function App() {
  const game = useGameState();

  const renderScreen = () => {
    switch (game.screen) {
      case SCREENS.TITLE:
        return (
          <TitleScreen
            setScreen={game.setScreen}
            detectiveName={game.detectiveName}
            setDetectiveName={game.setDetectiveName}
          />
        );
      case SCREENS.CASE_SELECT:
        return (
          <CaseSelectScreen
            cases={game.cases}
            startCase={game.startCase}
            setScreen={game.setScreen}
          />
        );
      case SCREENS.BRIEFING:
        return (
          <BriefingScreen
            selectedCase={game.selectedCase}
            employees={game.employees}
            startInvestigation={game.startInvestigation}
            setScreen={game.setScreen}
          />
        );
      case SCREENS.INVESTIGATION:
        return (
          <InvestigationScreen
            employees={game.employees}
            currentEmployeeIndex={game.currentEmployeeIndex}
            setCurrentEmployeeIndex={game.setCurrentEmployeeIndex}
            revealedClues={game.revealedClues}
            revealClue={game.revealClue}
            playerVerdicts={game.playerVerdicts}
            submitVerdict={game.submitVerdict}
            selectedVerdict={game.selectedVerdict}
            setSelectedVerdict={game.setSelectedVerdict}
            timeLeft={game.timeLeft}
            setTimeLeft={game.setTimeLeft}
            setTimerActive={game.setTimerActive}
            goToResults={game.goToResults}
            cluesUsed={game.cluesUsed}
          />
        );
      case SCREENS.RESULTS:
        return (
          <ResultsScreen
            results={game.results}
            score={game.score}
            selectedCase={game.selectedCase}
            detectiveName={game.detectiveName}
            setScreen={game.setScreen}
            cases={game.cases}
            startCase={game.startCase}
          />
        );
      case SCREENS.LEADERBOARD:
        return (
          <LeaderboardScreen
            leaderboard={game.leaderboard}
            setScreen={game.setScreen}
          />
        );
      default:
        return null;
    }
  };

  return <div className="App">{renderScreen()}</div>;
}

export default App;
