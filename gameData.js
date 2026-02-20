// All game cases, employees, and analytics data

export const CLUE_CATEGORIES = {
  PERFORMANCE: 'performance',
  ENGAGEMENT: 'engagement',
  BEHAVIOR: 'behavior',
  NETWORK: 'network',
  RISK: 'risk',
};

export const CASE_DIFFICULTY = {
  EASY: 'Junior Detective',
  MEDIUM: 'Senior Detective',
  HARD: 'Chief Inspector',
};

export const generateEmployeePool = () => [
  {
    id: 'EMP001',
    name: 'Alex Rivera',
    role: 'Senior Engineer',
    department: 'Engineering',
    tenure: 3.2,
    avatar: '👩‍💻',
    clues: {
      performance: { rating: 4.8, trend: 'up', recent_projects: 5, completion_rate: 98 },
      engagement: { survey_score: 72, eNPS: 8, last_survey: '2 months ago', participation: 'always' },
      behavior: { late_arrivals: 0, overtime_hours: 12, vacation_days_unused: 18, meeting_attendance: 95 },
      network: { internal_connections: 45, cross_dept_collab: 'high', mentees: 3, manager_1on1s: 'weekly' },
      risk: { competing_offers: true, linkedin_activity: 'very high', recent_salary_review: 'pending', market_rate_gap: '+22%' }
    },
    verdict: 'flight_risk',
    explanation: 'Top performer underpaid vs market by 22%, hasn\'t had salary review, LinkedIn activity spiked — classic retention risk pattern.'
  },
  {
    id: 'EMP002',
    name: 'Marcus Chen',
    role: 'Product Manager',
    department: 'Product',
    tenure: 6.8,
    avatar: '👨‍💼',
    clues: {
      performance: { rating: 3.1, trend: 'down', recent_projects: 2, completion_rate: 71 },
      engagement: { survey_score: 38, eNPS: 2, last_survey: '1 month ago', participation: 'rarely' },
      behavior: { late_arrivals: 8, overtime_hours: 0, vacation_days_unused: 3, meeting_attendance: 61 },
      network: { internal_connections: 12, cross_dept_collab: 'low', mentees: 0, manager_1on1s: 'skipped 3x' },
      risk: { competing_offers: false, linkedin_activity: 'low', recent_salary_review: '6 months ago', market_rate_gap: '+3%' }
    },
    verdict: 'disengaged',
    explanation: 'Crashing engagement scores, declining performance, avoiding meetings and 1:1s — this employee has mentally checked out.'
  },
  {
    id: 'EMP003',
    name: 'Priya Sharma',
    role: 'Data Analyst',
    department: 'Analytics',
    tenure: 1.1,
    avatar: '👩‍🔬',
    clues: {
      performance: { rating: 4.2, trend: 'up', recent_projects: 4, completion_rate: 91 },
      engagement: { survey_score: 81, eNPS: 9, last_survey: '3 weeks ago', participation: 'always' },
      behavior: { late_arrivals: 1, overtime_hours: 6, vacation_days_unused: 8, meeting_attendance: 94 },
      network: { internal_connections: 28, cross_dept_collab: 'medium', mentees: 0, manager_1on1s: 'bi-weekly' },
      risk: { competing_offers: false, linkedin_activity: 'normal', recent_salary_review: '2 months ago', market_rate_gap: '-5%' }
    },
    verdict: 'rising_star',
    explanation: 'High engagement, strong performance trajectory in first year, actively building internal network — clear high-potential talent to invest in.'
  },
  {
    id: 'EMP004',
    name: 'Jordan Blake',
    role: 'Sales Lead',
    department: 'Sales',
    tenure: 4.5,
    avatar: '🧑‍💼',
    clues: {
      performance: { rating: 4.6, trend: 'stable', recent_projects: 8, completion_rate: 94 },
      engagement: { survey_score: 76, eNPS: 8, last_survey: '6 weeks ago', participation: 'usually' },
      behavior: { late_arrivals: 3, overtime_hours: 9, vacation_days_unused: 5, meeting_attendance: 88 },
      network: { internal_connections: 67, cross_dept_collab: 'high', mentees: 2, manager_1on1s: 'weekly' },
      risk: { competing_offers: false, linkedin_activity: 'normal', recent_salary_review: '3 months ago', market_rate_gap: '+1%' }
    },
    verdict: 'steady_performer',
    explanation: 'Consistent performance, healthy engagement, well-connected — the reliable backbone of any team. No red flags, no urgent action needed.'
  },
  {
    id: 'EMP005',
    name: 'Dana Okonkwo',
    role: 'UX Designer',
    department: 'Design',
    tenure: 2.3,
    avatar: '🧑‍🎨',
    clues: {
      performance: { rating: 3.8, trend: 'up', recent_projects: 3, completion_rate: 85 },
      engagement: { survey_score: 58, eNPS: 5, last_survey: '2 months ago', participation: 'sometimes' },
      behavior: { late_arrivals: 2, overtime_hours: 21, overtime_trend: 'increasing', vacation_days_unused: 22, meeting_attendance: 79 },
      network: { internal_connections: 19, cross_dept_collab: 'low', mentees: 0, manager_1on1s: 'monthly' },
      risk: { competing_offers: false, linkedin_activity: 'low', recent_salary_review: '8 months ago', market_rate_gap: '+8%' }
    },
    verdict: 'burnout_risk',
    explanation: 'Skyrocketing overtime hours, 22 unused vacation days, dipping engagement — this employee is heading toward burnout. Intervention needed now.'
  },
  {
    id: 'EMP006',
    name: 'Sam Patel',
    role: 'Engineering Manager',
    department: 'Engineering',
    tenure: 7.2,
    avatar: '🧑‍💻',
    clues: {
      performance: { rating: 4.1, trend: 'stable', recent_projects: 6, completion_rate: 89 },
      engagement: { survey_score: 69, eNPS: 7, last_survey: '5 weeks ago', participation: 'always' },
      behavior: { late_arrivals: 0, overtime_hours: 14, vacation_days_unused: 6, meeting_attendance: 97 },
      network: { internal_connections: 89, cross_dept_collab: 'very high', mentees: 5, manager_1on1s: 'weekly' },
      risk: { competing_offers: false, linkedin_activity: 'normal', recent_salary_review: '4 months ago', market_rate_gap: '+5%' }
    },
    verdict: 'promotion_ready',
    explanation: 'Strong network, actively mentoring 5 people, cross-dept influence, consistent delivery — this person is ready to step up to Director level.'
  },
];

export const CASES = [
  {
    id: 'case_001',
    title: 'The Silent Resignation',
    difficulty: CASE_DIFFICULTY.EASY,
    description: 'HR has flagged unusual activity in the Engineering department. One employee appears to be quietly disengaging. Analyze the data and identify the real issue.',
    backstory: 'Q3 engineering velocity dropped 18%. The team seems fine on the surface — but something\'s brewing. Your job: figure out who needs attention and why.',
    employeeIds: ['EMP001', 'EMP002', 'EMP003'],
    targetClues: 3,
    timeLimit: 120,
    scoringCriteria: {
      perfect: 1000,
      clueBonus: 50,
      timeBonus: 100,
    }
  },
  {
    id: 'case_002',
    title: 'The Burnout Brigade',
    difficulty: CASE_DIFFICULTY.MEDIUM,
    description: 'Three employees across different departments are showing concerning patterns. One is at serious risk of burning out. Find them before it\'s too late.',
    backstory: 'The company just finished a monster product launch. 90-hour weeks for 6 months. Medical claims are up 23%. You need to find who\'s on the edge.',
    employeeIds: ['EMP004', 'EMP005', 'EMP006'],
    targetClues: 4,
    timeLimit: 90,
    scoringCriteria: {
      perfect: 1500,
      clueBonus: 75,
      timeBonus: 150,
    }
  },
  {
    id: 'case_003',
    title: 'Operation Talent Drain',
    difficulty: CASE_DIFFICULTY.HARD,
    description: 'Intelligence suggests two employees are considering leaving. One is actively interviewing, one is a future leader hiding in plain sight. Solve both mysteries.',
    backstory: 'The CFO called an emergency meeting. Two key roles could go vacant within 60 days. Replacement costs: $340,000. You have the data. Use it.',
    employeeIds: ['EMP001', 'EMP004', 'EMP005', 'EMP006'],
    targetClues: 5,
    timeLimit: 60,
    scoringCriteria: {
      perfect: 2500,
      clueBonus: 100,
      timeBonus: 200,
    }
  },
];

export const VERDICT_OPTIONS = [
  { id: 'flight_risk', label: '✈️ Flight Risk', description: 'Likely to leave within 90 days', color: '#ff4444' },
  { id: 'disengaged', label: '😶 Disengaged', description: 'Mentally checked out, performance declining', color: '#ff8c00' },
  { id: 'rising_star', label: '⭐ Rising Star', description: 'High-potential talent on an upward trajectory', color: '#00d4aa' },
  { id: 'steady_performer', label: '🏛️ Steady Performer', description: 'Reliable backbone, no major concerns', color: '#4488ff' },
  { id: 'burnout_risk', label: '🔥 Burnout Risk', description: 'Overworked, heading toward breakdown', color: '#ff6b35' },
  { id: 'promotion_ready', label: '🚀 Promotion Ready', description: 'Exceeding current role, ready to step up', color: '#a855f7' },
];

export const CLUE_DESCRIPTIONS = {
  performance: {
    icon: '📊',
    label: 'Performance File',
    description: 'Project completion, ratings, output trends',
  },
  engagement: {
    icon: '💬',
    label: 'Engagement Report',
    description: 'Survey scores, eNPS, participation patterns',
  },
  behavior: {
    icon: '🕐',
    label: 'Behavioral Signals',
    description: 'Attendance, overtime, vacation usage',
  },
  network: {
    icon: '🔗',
    label: 'Network Map',
    description: 'Connections, mentorship, collaboration patterns',
  },
  risk: {
    icon: '⚠️',
    label: 'Risk Indicators',
    description: 'Market signals, LinkedIn, salary competitiveness',
  },
};
