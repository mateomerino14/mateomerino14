import {CARD, COLORS} from './theme.js';
import {fadeDelay, formatDate, formatNumber, renderCard} from './svg.js';

const WIDTH = 830;
const COLUMN_WIDTH = (WIDTH - CARD.padding * 2) / 3;
const VALUE_Y = 101;
const LABEL_Y = 145;
const RANGE_Y = 168;
const RING = {cy: 90, radius: 33, stroke: 5};

const emptyStreak = {length: 0, start: null, end: null};

export const summarizeStreak = (days) => {
  const sorted = [...days].sort((dayA, dayB) => dayA.date.localeCompare(dayB.date));
  const total = sorted.reduce((sum, day) => sum + day.count, 0);

  let longest = emptyStreak;
  let running = emptyStreak;
  sorted.forEach((day) => {
    if (day.count === 0) {
      running = emptyStreak;
      return;
    }
    running = {length: running.length + 1, start: running.start ?? day.date, end: day.date};
    if (running.length > longest.length) longest = running;
  });

  const lastIndex = sorted.length - 1;
  const todayIsEmpty = sorted[lastIndex]?.count === 0;
  let index = todayIsEmpty ? lastIndex - 1 : lastIndex;
  let current = emptyStreak;
  while (index >= 0 && sorted[index].count > 0) {
    current = {length: current.length + 1, start: sorted[index].date, end: current.end ?? sorted[index].date};
    index -= 1;
  }

  return {total, firstDate: sorted[0]?.date, current, longest};
};

const describeRange = (streak) => {
  if (streak.length === 0) return 'Sin racha activa';
  if (streak.start === streak.end) return formatDate(streak.start, true);
  const crossesYear = streak.start.slice(0, 4) !== streak.end.slice(0, 4);
  return `${formatDate(streak.start, crossesYear)} – ${formatDate(streak.end, true)}`;
};

const renderColumn = ({value, label, range, valueClass = 'big'}, index) => {
  const x = CARD.padding + COLUMN_WIDTH * index + COLUMN_WIDTH / 2;
  return `<g class="fade" ${fadeDelay(index, 180)}>
    <text x="${x}" y="${VALUE_Y}" text-anchor="middle" class="${valueClass}">${value}</text>
    <text x="${x}" y="${LABEL_Y}" text-anchor="middle" class="caption">${label}</text>
    <text x="${x}" y="${RANGE_Y}" text-anchor="middle" class="small">${range}</text>
  </g>`;
};

const renderDividers = () =>
  [1, 2]
    .map((index) => {
      const x = CARD.padding + COLUMN_WIDTH * index;
      return `<line x1="${x}" y1="55" x2="${x}" y2="170" stroke="${COLORS.line}"/>`;
    })
    .join('');

const renderCurrentRing = () => {
  const cx = CARD.padding + COLUMN_WIDTH * 1.5;
  return `<circle cx="${cx}" cy="${RING.cy}" r="${RING.radius}" fill="none" stroke="${COLORS.accent}" stroke-width="${RING.stroke}" class="pulse"/>`;
};

const streakStyles = `
  .big { font-size: 30px; font-weight: 700; fill: ${COLORS.paper}; }
  .current { font-size: 30px; font-weight: 700; fill: ${COLORS.signal}; }
  .caption { font-size: 14px; font-weight: 600; fill: ${COLORS.paper}; }
  .pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2.4s ease-in-out infinite; }
  @keyframes pulse { 50% { opacity: 0.45; } }
`;

export const renderStreakCard = (streak) => {
  const columns = [
    {value: formatNumber(streak.total), label: 'Contribuciones totales', range: `Desde ${formatDate(streak.firstDate, true)}`},
    {value: formatNumber(streak.current.length), label: 'Racha actual', range: describeRange(streak.current), valueClass: 'current'},
    {value: formatNumber(streak.longest.length), label: 'Racha más larga', range: describeRange(streak.longest)},
  ];
  return renderCard({
    width: WIDTH,
    title: 'Racha de contribuciones',
    description: columns.map((column) => `${column.label}: ${column.value}`).join(', '),
    styles: streakStyles,
    body: `${renderDividers()}${renderCurrentRing()}${columns.map(renderColumn).join('')}`,
  });
};
