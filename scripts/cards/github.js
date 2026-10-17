const GRAPHQL_URL = 'https://api.github.com/graphql';
const MAX_REPOSITORIES = 100;
const MAX_LANGUAGES_PER_REPO = 10;

const PROFILE_QUERY = `
  query Profile($login: String!) {
    user(login: $login) {
      createdAt
      followers { totalCount }
      pullRequests { totalCount }
      issues { totalCount }
      repositoriesContributedTo(contributionTypes: [COMMIT, PULL_REQUEST, ISSUE, REPOSITORY]) { totalCount }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestReviewContributions
      }
      repositories(first: ${MAX_REPOSITORIES}, ownerAffiliations: OWNER, isFork: false) {
        nodes {
          stargazerCount
          languages(first: ${MAX_LANGUAGES_PER_REPO}, orderBy: {field: SIZE, direction: DESC}) {
            edges { size node { name } }
          }
        }
      }
    }
  }
`;

const CALENDAR_QUERY = `
  query Calendar($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
  }
`;

const requestGraphql = async (query, variables) => {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({query, variables}),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors) {
    throw new Error(`GitHub GraphQL: ${JSON.stringify(payload.errors ?? payload)}`);
  }
  return payload.data;
};

export const fetchProfile = async (login) => {
  const data = await requestGraphql(PROFILE_QUERY, {login});
  return data.user;
};

const fetchYearDays = async (login, year, now) => {
  const from = new Date(Date.UTC(year, 0, 1));
  const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
  const to = endOfYear < now ? endOfYear : now;
  const data = await requestGraphql(CALENDAR_QUERY, {login, from: from.toISOString(), to: to.toISOString()});
  return data.user.contributionsCollection.contributionCalendar.weeks.flatMap((week) => week.contributionDays);
};

export const fetchContributionDays = async (login, createdAt) => {
  const now = new Date();
  const firstYear = new Date(createdAt).getUTCFullYear();
  const years = Array.from({length: now.getUTCFullYear() - firstYear + 1}, (_, index) => firstYear + index);
  const daysByYear = await Promise.all(years.map((year) => fetchYearDays(login, year, now)));
  return daysByYear.flat().map((day) => ({date: day.date, count: day.contributionCount}));
};
