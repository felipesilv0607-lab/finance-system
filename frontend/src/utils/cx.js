// Junta nomes de classe ignorando valores falsos: cx('a', cond && 'b', ['c']).
export function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(' ');
}
