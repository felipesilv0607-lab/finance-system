import test from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import { apiDateToInputValue, formatDate, toDateInputValue } from './date.js';
import { periodRange } from './period.js';

// Fusos testados (offset em janeiro, sentido de getTimezoneOffset: minutos a
// SOMAR ao horário local para chegar ao UTC).
const ZONES = [
  ['America/Sao_Paulo', 180], // UTC-3
  ['UTC', 0],
  ['Europe/Paris', -60], // UTC+1
  ['Asia/Tokyo', -540], // UTC+9
  ['Pacific/Kiritimati', -840], // UTC+14
  ['America/Los_Angeles', 480], // UTC-8
];

// Dias de calendário: datas pedidas, meses de 28/29/30/31 dias e virada de ano.
const DAYS = [
  '2026-01-01', '2026-11-10', '2026-11-19', '2026-12-31', '2027-01-01',
  '2026-02-28', '2028-02-29', '2026-04-30', '2026-01-31', '2025-12-31',
];

// Executa fn com o fuso do processo trocado (o Node aplica TZ em tempo de execução).
function inZone(zone, expectedOffset, fn) {
  const previous = process.env.TZ;
  process.env.TZ = zone;

  try {
    assert.equal(new Date(2026, 0, 15).getTimezoneOffset(), expectedOffset, `fuso ${zone} não foi aplicado`);
    fn();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

// O que o backend faz com o valor do formulário (transactionValidation.js).
const backendStore = (inputValue) => new Date(inputValue).toISOString();

for (const [zone, offset] of ZONES) {
  test(`${zone}: data gravada é exibida e editada no mesmo dia`, () => {
    inZone(zone, offset, () => {
      for (const day of DAYS) {
        const stored = backendStore(day);
        const [year, month, date] = day.split('-');

        assert.equal(stored, `${day}T00:00:00.000Z`, day);
        assert.equal(apiDateToInputValue(stored), day, `campo de edição de ${day}`);
        assert.equal(formatDate(stored), `${date}/${month}/${year}`, `exibição de ${day}`);
      }
    });
  });

  test(`${zone}: salvar sem mexer na data preserva o dia (5 ciclos)`, () => {
    inZone(zone, offset, () => {
      for (const day of DAYS) {
        let stored = backendStore(day);

        for (let cycle = 0; cycle < 5; cycle += 1) {
          stored = backendStore(apiDateToInputValue(stored));
        }

        assert.equal(apiDateToInputValue(stored), day, day);
      }
    });
  });
}

test('registros antigos de Transações (meio-dia de São Paulo = 15:00Z) mantêm o dia', () => {
  inZone('America/Sao_Paulo', 180, () => {
    assert.equal(apiDateToInputValue('2026-11-19T15:00:00.000Z'), '2026-11-19');
    assert.equal(formatDate('2026-11-19T15:00:00.000Z'), '19/11/2026');
  });
});

test('valor inválido não gera "NaN"', () => {
  assert.equal(apiDateToInputValue('não é data'), '');
  assert.equal(formatDate(undefined), '');
});

test('"hoje" do formulário continua sendo o dia LOCAL', () => {
  inZone('America/Sao_Paulo', 180, () => {
    // 23:30 de 19/11 em São Paulo já é 20/11 em UTC.
    assert.equal(toDateInputValue(new Date('2026-11-20T02:30:00.000Z')), '2026-11-19');
  });
  inZone('Pacific/Kiritimati', -840, () => {
    // 10:00 UTC de 19/11 já é 20/11 em Kiritimati.
    assert.equal(toDateInputValue(new Date('2026-11-19T10:00:00.000Z')), '2026-11-20');
  });
});

// Dashboard: os limites do período usam o mesmo formato das datas gravadas.
const within = ({ from, to }, day) => {
  const t = new Date(backendStore(day)).getTime();
  return t >= new Date(from).getTime() && t < new Date(to).getTime();
};

for (const [zone, offset] of ZONES) {
  test(`${zone}: "Este mês" inclui o dia 1º e o último dia, exclui os vizinhos`, () => {
    inZone(zone, offset, () => {
      const range = periodRange('this-month', new Date(2026, 10, 30, 23, 30)); // 30/11 23:30 local

      assert.equal(range.from, '2026-11-01T00:00:00.000Z');
      assert.equal(range.to, '2026-12-01T00:00:00.000Z');
      assert.ok(within(range, '2026-11-01'), '1º de novembro');
      assert.ok(within(range, '2026-11-30'), '30 de novembro');
      assert.ok(!within(range, '2026-10-31'), '31 de outubro');
      assert.ok(!within(range, '2026-12-01'), '1º de dezembro');
    });
  });
}

test('virada de ano: "Mês passado" em janeiro é dezembro do ano anterior', () => {
  inZone('America/Sao_Paulo', 180, () => {
    const range = periodRange('last-month', new Date(2027, 0, 1, 0, 30));

    assert.equal(range.from, '2026-12-01T00:00:00.000Z');
    assert.equal(range.to, '2027-01-01T00:00:00.000Z');
    assert.ok(within(range, '2026-12-31'));
    assert.ok(!within(range, '2027-01-01'));
  });
});
