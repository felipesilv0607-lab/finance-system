import { useEffect, useId, useRef, useState } from 'react';
import { cx } from '../../utils/cx';
import { getPopoverAction, hasFocusLeft, shouldCloseOnFocusOut } from './popover-keys';

// Painel flutuante no padrão "disclosure": o gatilho é um <button> com
// aria-expanded/aria-controls e o painel vem logo depois dele no DOM, então
// Tab entra no conteúdo naturalmente. Fecha com ESC (devolvendo o foco ao
// gatilho), clique fora ou Tab para fora.
//
// `trigger` é o conteúdo do botão; `children` pode ser uma função que recebe
// `close` para fechar depois de uma ação.
function Popover({
  label,
  trigger,
  align = 'end',
  className,
  triggerClassName,
  panelClassName,
  children,
}) {
  const [open, setOpen] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();

  // Devolver o foco ao gatilho vira efeito de um contador: evita ler/escrever
  // refs durante o render e dispara só quando o fechamento pediu o foco.
  useEffect(() => {
    if (focusTrigger > 0) triggerRef.current?.focus();
  }, [focusTrigger]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    function handleKeyDown(event) {
      const action = getPopoverAction({ key: event.key, open: true });

      if (action === 'close-and-focus-trigger') {
        event.stopPropagation();
        setOpen(false);
        setFocusTrigger((count) => count + 1);
      } else if (action === 'check-focus') {
        // O foco só muda depois do evento: confere no próximo quadro.
        requestAnimationFrame(() => {
          if (
            hasFocusLeft({
              activeElement: document.activeElement,
              container: rootRef.current,
              body: document.body,
            })
          ) {
            setOpen(false);
          }
        });
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function close({ returnFocus = true } = {}) {
    setOpen(false);

    if (returnFocus) setFocusTrigger((count) => count + 1);
  }

  function handleBlur(event) {
    if (
      shouldCloseOnFocusOut({
        open,
        relatedTarget: event.relatedTarget,
        container: event.currentTarget,
      })
    ) {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cx('ui-popover', className)} onBlur={handleBlur}>
      <button
        ref={triggerRef}
        type="button"
        className={cx('ui-popover__trigger', triggerClassName)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
      >
        {trigger}
      </button>

      {open && (
        <div
          id={panelId}
          tabIndex={-1}
          className={cx('ui-popover__panel', `ui-popover__panel--${align}`, panelClassName)}
        >
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  );
}

export default Popover;
