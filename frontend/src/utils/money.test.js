import test from "node:test";
import assert from "node:assert/strict";
import { formatCurrency, sumAmounts, toAmountPayload } from "./money.js";
import { toDateInputValue } from "./date.js";

test("sumAmounts soma em centavos sem erro de float", () => {
  assert.equal(sumAmounts(["0.10", "0.20"]), "0.30");
  assert.equal(sumAmounts(["1234.50", "0.05", "-10.00"]), "1224.55");
  assert.equal(sumAmounts([]), "0.00");
});

test("toAmountPayload normaliza vírgula e casas, sem converter para número", () => {
  assert.equal(toAmountPayload("12,5"), "12.50");
  assert.equal(toAmountPayload("7"), "7.00");
  assert.equal(toAmountPayload("1e3"), "1e3");
  assert.equal(toAmountPayload("1.234"), "1.234");
});

test("formatCurrency formata string decimal em BRL", () => {
  assert.match(formatCurrency("1234.50"), /1\.234,50/);
  assert.match(formatCurrency(undefined), /0,00/);
});

test("toDateInputValue usa o dia local, não UTC", () => {
  assert.equal(toDateInputValue(new Date(2026, 0, 5, 23, 30)), "2026-01-05");
});
