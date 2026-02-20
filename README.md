# 🔍 Talent Scout — The People Analytics Detective Game

A web-based detective game where players solve workforce mysteries using real people analytics concepts. Analyze employee data, spot patterns, and file verdicts before time runs out.

![Game Preview](https://via.placeholder.com/800x400/0a0a0f/f5c842?text=TALENT+SCOUT)

## 🎮 How to Play

1. **Enter your detective name** on the title screen
2. **Select a case** (3 cases, increasing difficulty)
3. **Read the briefing** — understand the situation
4. **Investigate employees** by revealing data files:
   - 📊 Performance File
   - 💬 Engagement Report
   - 🕐 Behavioral Signals
   - 🔗 Network Map
   - ⚠️ Risk Indicators
5. **File your verdict** for each employee:
   - ✈️ Flight Risk
   - 😶 Disengaged
   - ⭐ Rising Star
   - 🏛️ Steady Performer
   - 🔥 Burnout Risk
   - 🚀 Promotion Ready
6. **Submit the case** before the timer runs out

## 🏆 Scoring

- **Correct verdicts** earn base points
- **Fewer clues used** = higher score per verdict
- **Speed bonus** for finishing under the time limit
- Top scores saved to local leaderboard

## 📊 People Analytics Concepts

The game teaches real HR analytics skills:
- **eNPS & Engagement Surveys** — measuring employee sentiment
- **Flight Risk Indicators** — LinkedIn activity, salary gaps, tenure patterns
- **Burnout Signals** — overtime trends, unused vacation, declining output
- **Performance Trajectory** — trending up/down, project completion rates
- **Network Analysis** — internal connections, cross-dept collaboration
- **Promotion Readiness** — mentoring, influence, consistent delivery

## 🛠️ Tech Stack

- **React 18** — UI framework
- **CSS Modules** — component-scoped styling
- **Local Storage** — persistent leaderboard
- **Google Fonts** — Bebas Neue, Space Mono, DM Sans

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/talent-scout-game.git
cd talent-scout-game

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to play.

## 📁 Project Structure

```
src/
├── components/
│   ├── TitleScreen.jsx          # Main landing / name entry
│   ├── TitleScreen.module.css
│   ├── CaseSelectScreen.jsx     # Case file browser
│   ├── CaseSelectScreen.module.css
│   ├── BriefingScreen.jsx       # Pre-game case briefing
│   ├── BriefingScreen.module.css
│   ├── InvestigationScreen.jsx  # Main gameplay
│   ├── InvestigationScreen.module.css
│   ├── ResultsScreen.jsx        # Score & case debrief
│   ├── ResultsScreen.module.css
│   ├── LeaderboardScreen.jsx    # High scores
│   └── LeaderboardScreen.module.css
├── data/
│   └── gameData.js              # All employees, cases, verdicts
├── hooks/
│   └── useGameState.js          # Game state management
├── App.js
├── App.css
└── index.js
```

## ✏️ Adding More Cases & Employees

Edit `src/data/gameData.js`:

1. Add employees to `generateEmployeePool()` with clue data and a `verdict` field
2. Add new cases to `CASES` array with `employeeIds` referencing your employees
3. The game automatically picks them up — no other changes needed

## 🎨 Design

Dark, neo-noir aesthetic with:
- **Bebas Neue** display font for the detective-noir feel
- **Space Mono** for data/terminal readability
- Scanline texture overlay
- Animated grid background
- CSS-only micro-interactions

## 📄 License

MIT — free to use, fork, and expand.

---

Built as a people analytics learning tool. Great for HR teams, L&D programs, and anyone who wants to learn workforce analytics through gameplay.
