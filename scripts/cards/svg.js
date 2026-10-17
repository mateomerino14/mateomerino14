import {CARD, COLORS, FONTS, LOCALE} from './theme.js';

const XML_ENTITIES = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'};

export const escapeXml = (text) => String(text).replace(/[&<>"']/g, (char) => XML_ENTITIES[char]);

export const formatNumber = (value) => new Intl.NumberFormat(LOCALE).format(value);

export const formatDate = (isoDate, withYear = false) => {
  const options = {day: 'numeric', month: 'short', timeZone: 'UTC'};
  if (withYear) options.year = 'numeric';
  return new Intl.DateTimeFormat(LOCALE, options).format(new Date(isoDate)).replace('.', '');
};

const baseStyles = `
  text { font-family: ${FONTS.sans}; fill: ${COLORS.paper}; }
  .title { font-size: ${CARD.titleSize}px; font-weight: 600; fill: ${COLORS.accent}; }
  .label { font-size: ${CARD.textSize}px; fill: ${COLORS.fog}; }
  .value { font-size: ${CARD.textSize}px; font-weight: 600; }
  .small { font-size: ${CARD.smallSize}px; fill: ${COLORS.fog}; }
  .fade { opacity: 0; animation: fade 0.6s ease-out forwards; }
  @keyframes fade { to { opacity: 1; } }
`;

export const renderCard = ({width, title, description, body, styles = ''}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${CARD.height}" viewBox="0 0 ${width} ${CARD.height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(description)}</desc>
  <style>${baseStyles}${styles}</style>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${CARD.height - 1}" rx="${CARD.radius}" fill="${COLORS.inkSoft}" stroke="${COLORS.line}"/>
  <text x="${CARD.padding}" y="${CARD.padding + 10}" class="title">${escapeXml(title)}</text>
  ${body}
</svg>
`;

export const fadeDelay = (index, step = 120) => `style="animation-delay: ${index * step}ms"`;
