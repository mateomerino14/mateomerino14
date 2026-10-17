import {CARD, LANGUAGE_PALETTE} from './theme.js';
import {escapeXml, fadeDelay, renderCard} from './svg.js';

const WIDTH = 350;
const TOP_LANGUAGES = 5;
const OTHERS_LABEL = 'Otros';
const EXCLUDED_LANGUAGES = new Set(['TeX']);
const BAR = {y: 55, height: 9, gap: 2};
const LEGEND = {firstY: 102, rowHeight: 31, columnWidth: 150, valueInset: 10};

export const summarizeLanguages = (user) => {
  const sizes = new Map();
  user.repositories.nodes
    .flatMap((repo) => repo.languages.edges)
    .filter(({node}) => !EXCLUDED_LANGUAGES.has(node.name))
    .forEach(({size, node}) => sizes.set(node.name, (sizes.get(node.name) ?? 0) + size));

  const total = [...sizes.values()].reduce((sum, size) => sum + size, 0);
  const sorted = [...sizes.entries()].sort(([, sizeA], [, sizeB]) => sizeB - sizeA);
  const top = sorted.slice(0, TOP_LANGUAGES);
  const othersSize = sorted.slice(TOP_LANGUAGES).reduce((sum, [, size]) => sum + size, 0);
  if (othersSize > 0) top.push([OTHERS_LABEL, othersSize]);

  return top.map(([name, size], index) => ({
    name,
    percent: (size / total) * 100,
    color: LANGUAGE_PALETTE[index],
  }));
};

const renderBar = (languages) => {
  const usableWidth = WIDTH - CARD.padding * 2 - BAR.gap * (languages.length - 1);
  let x = CARD.padding;
  const segments = languages.map((language) => {
    const width = Math.max(2, (usableWidth * language.percent) / 100);
    const segment = `<rect x="${x.toFixed(2)}" y="${BAR.y}" width="${width.toFixed(2)}" height="${BAR.height}" fill="${language.color}"/>`;
    x += width + BAR.gap;
    return segment;
  });
  return `<clipPath id="bar"><rect x="${CARD.padding}" y="${BAR.y}" width="${WIDTH - CARD.padding * 2}" height="${BAR.height}" rx="${BAR.height / 2}"/></clipPath>
  <g clip-path="url(#bar)" class="grow">${segments.join('')}</g>`;
};

const renderLegendItem = (language, index) => {
  const column = index % 2;
  const row = Math.floor(index / 2);
  const x = CARD.padding + column * LEGEND.columnWidth;
  const y = LEGEND.firstY + row * LEGEND.rowHeight;
  return `<g class="fade" ${fadeDelay(index)}>
    <circle cx="${x + 5}" cy="${y - 5}" r="5" fill="${language.color}"/>
    <text x="${x + 17}" y="${y}" class="label">${escapeXml(language.name)}</text>
    <text x="${x + LEGEND.columnWidth - LEGEND.valueInset}" y="${y}" text-anchor="end" class="small">${language.percent.toFixed(1)} %</text>
  </g>`;
};

const barStyles = `
  .grow { transform-origin: ${CARD.padding}px 0; transform: scaleX(0); animation: grow 0.9s ease-out forwards; }
  @keyframes grow { to { transform: scaleX(1); } }
`;

export const renderLanguagesCard = (languages) =>
  renderCard({
    width: WIDTH,
    title: 'Lenguajes más usados',
    description: languages.map((language) => `${language.name} ${language.percent.toFixed(1)} %`).join(', '),
    styles: barStyles,
    body: `${renderBar(languages)}${languages.map(renderLegendItem).join('')}`,
  });
