const dashboardService = require('../services/dashboardService');

function parseDate(value) {
  if (value === undefined) return undefined;

  const date = new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
}

// Período padrão: mês corrente (UTC). O cliente pode enviar from/to
// (ISO, intervalo [from, to)) para respeitar o fuso do usuário.
function defaultPeriod(now = new Date()) {
  return {
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  };
}

async function getSummary(req, res, next) {
  try {
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    if (from === null || to === null) {
      return res.status(400).json({ error: 'from and to must be valid dates' });
    }

    if ((from === undefined) !== (to === undefined)) {
      return res.status(400).json({ error: 'from and to must be provided together' });
    }

    const period = from && to ? { from, to } : defaultPeriod();

    if (period.from >= period.to) {
      return res.status(400).json({ error: 'from must be before to' });
    }

    return res.status(200).json(
      await dashboardService.getSummary(req.user.id, period)
    );
  } catch (error) {
    return next(error);
  }
}

module.exports = { getSummary, defaultPeriod };
