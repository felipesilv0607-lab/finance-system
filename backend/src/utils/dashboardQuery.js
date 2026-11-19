const { isValidUUID } = require('./uuid');

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 3660;
const DEFAULT_RECENT = 8;
const MAX_RECENT = 20;

function defaultPeriod(now = new Date()) {
  return {
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  };
}

function parseDate(value) {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

// Valida os parâmetros de GET /dashboard/overview. Retorna { errors, params }.
function parseOverviewQuery(query, now = new Date()) {
  const errors = {};
  let period = defaultPeriod(now);

  const hasFrom = query.from !== undefined;
  const hasTo = query.to !== undefined;

  if (hasFrom !== hasTo) {
    errors.period = 'from and to must be provided together';
  } else if (hasFrom) {
    const from = parseDate(query.from);
    const to = parseDate(query.to);

    if (!from || !to) {
      errors.period = 'from and to must be valid dates';
    } else if (from >= to) {
      errors.period = 'from must be before to';
    } else if ((to - from) / DAY_MS > MAX_RANGE_DAYS) {
      errors.period = `period must not exceed ${MAX_RANGE_DAYS} days`;
    } else {
      period = { from, to };
    }
  }

  const params = { ...period };

  for (const key of ['accountId', 'categoryId']) {
    if (query[key] !== undefined) {
      if (!isValidUUID(String(query[key]))) {
        errors[key] = `${key} must be a valid UUID`;
      } else {
        params[key] = String(query[key]);
      }
    }
  }

  params.recentLimit = DEFAULT_RECENT;

  if (query.recent !== undefined) {
    const value = Number(query.recent);

    if (!Number.isInteger(value) || value < 1 || value > MAX_RECENT) {
      errors.recent = `recent must be an integer between 1 and ${MAX_RECENT}`;
    } else {
      params.recentLimit = value;
    }
  }

  return { errors, params };
}

module.exports = { parseOverviewQuery, defaultPeriod, MAX_RANGE_DAYS };
