import {CARD, COLORS} from './theme.js';
import {fadeDelay, formatNumber, renderCard} from './svg.js';

const WIDTH = 467;
const ROW_HEIGHT = 25;
const FIRST_ROW_Y = 72;
const VALUE_X = 230;
const RING = {cx: 375, cy: 108, radius: 40, stroke: 6};

const RANK_WEIGHTS = {commits: 2, prs: 3, issues: 1, reviews: 1, stars: 4, followers: 1};
const RANK_MEDIANS = {commits: 250, prs: 50, issues: 25, reviews: 2, stars: 50, followers: 10};
const RANK_THRESHOLDS = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
const RANK_LEVELS = ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];

const exponentialCdf = (value) => 1 - 2 ** -value;
const logNormalCdf = (value) => value / (1 + value);

export const summarizeStats = (user) => ({
  commits: user.contributionsCollection.totalCommitContributions,
  prs: user.pullRequests.totalCount,
  issues: user.issues.totalCount,
  reviews: user.contributionsCollection.totalPullRequestReviewContributions,
  stars: user.repositories.nodes.reduce((total, repo) => total + repo.stargazerCount, 0),
  followers: user.followers.totalCount,
  contributedTo: user.repositoriesContributedTo.totalCount,
});

export const calculateRank = (stats) => {
  const totalWeight = Object.values(RANK_WEIGHTS).reduce((total, weight) => total + weight, 0);
  const score =
    RANK_WEIGHTS.commits * exponentialCdf(stats.commits / RANK_MEDIANS.commits) +
    RANK_WEIGHTS.prs * exponentialCdf(stats.prs / RANK_MEDIANS.prs) +
    RANK_WEIGHTS.issues * exponentialCdf(stats.issues / RANK_MEDIANS.issues) +
    RANK_WEIGHTS.reviews * exponentialCdf(stats.reviews / RANK_MEDIANS.reviews) +
    RANK_WEIGHTS.stars * logNormalCdf(stats.stars / RANK_MEDIANS.stars) +
    RANK_WEIGHTS.followers * logNormalCdf(stats.followers / RANK_MEDIANS.followers);
  const percentile = (1 - score / totalWeight) * 100;
  const levelIndex = RANK_THRESHOLDS.findIndex((threshold) => percentile <= threshold);
  return {level: RANK_LEVELS[levelIndex], percentile};
};

const renderRow = ({label, value}, index) => {
  const y = FIRST_ROW_Y + index * ROW_HEIGHT;
  return `<g class="fade" ${fadeDelay(index)}>
    <circle cx="${CARD.padding + 4}" cy="${y - 5}" r="3.5" fill="${COLORS.signal}"/>
    <text x="${CARD.padding + 16}" y="${y}" class="label">${label}</text>
    <text x="${VALUE_X}" y="${y}" class="value">${formatNumber(value)}</text>
  </g>`;
};

const renderRing = ({level, percentile}) => {
  const circumference = 2 * Math.PI * RING.radius;
  const progress = circumference * (1 - percentile / 100);
  return `<g transform="rotate(-90 ${RING.cx} ${RING.cy})">
    <circle cx="${RING.cx}" cy="${RING.cy}" r="${RING.radius}" fill="none" stroke="${COLORS.line}" stroke-width="${RING.stroke}"/>
    <circle cx="${RING.cx}" cy="${RING.cy}" r="${RING.radius}" fill="none" stroke="${COLORS.accent}" stroke-width="${RING.stroke}" stroke-linecap="round"
      stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${circumference.toFixed(2)}" class="ring" style="--progress: ${progress.toFixed(2)}"/>
  </g>
  <text x="${RING.cx}" y="${RING.cy + 9}" text-anchor="middle" class="rank">${level}</text>
  <text x="${RING.cx}" y="${RING.cy + RING.radius + 24}" text-anchor="middle" class="small">Top ${Math.max(1, Math.round(percentile))} %</text>`;
};

const ringStyles = `
  .rank { font-size: 26px; font-weight: 700; fill: ${COLORS.paper}; }
  .ring { animation: ring 1s ease-out forwards 0.3s; }
  @keyframes ring { to { stroke-dashoffset: var(--progress); } }
`;

export const renderStatsCard = (stats, year) => {
  const rows = [
    {label: `Commits en ${year}`, value: stats.commits},
    {label: 'Pull requests', value: stats.prs},
    {label: 'Issues', value: stats.issues},
    {label: 'Repos con aportes', value: stats.contributedTo},
    {label: 'Estrellas', value: stats.stars},
  ];
  return renderCard({
    width: WIDTH,
    title: 'Estadísticas de GitHub',
    description: rows.map((row) => `${row.label}: ${row.value}`).join(', '),
    styles: ringStyles,
    body: `${rows.map(renderRow).join('')}${renderRing(calculateRank(stats))}`,
  });
};
