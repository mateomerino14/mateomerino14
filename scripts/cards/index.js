import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fetchContributionDays, fetchProfile} from './github.js';
import {renderLanguagesCard, summarizeLanguages} from './languages.js';
import {renderStatsCard, summarizeStats} from './stats.js';
import {renderStreakCard, summarizeStreak} from './streak.js';

const login = process.env.PROFILE_LOGIN;
const outputDir = process.argv[2] ?? 'dist';

const main = async () => {
  const user = await fetchProfile(login);
  const days = await fetchContributionDays(login, user.createdAt);
  const year = new Date().getUTCFullYear();

  const cards = {
    'stats.svg': renderStatsCard(summarizeStats(user), year),
    'languages.svg': renderLanguagesCard(summarizeLanguages(user)),
    'streak.svg': renderStreakCard(summarizeStreak(days)),
  };

  await mkdir(outputDir, {recursive: true});
  await Promise.all(Object.entries(cards).map(([name, svg]) => writeFile(join(outputDir, name), svg)));
  console.log(`Tarjetas generadas en ${outputDir}: ${Object.keys(cards).join(', ')}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
