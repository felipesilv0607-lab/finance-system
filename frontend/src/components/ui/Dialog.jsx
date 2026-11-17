import { useEffect, useId, useRef } from 'react';
import { cx } from '../../utils/cx';
import Button from './Button';
import IconButton from './IconButton';

// Modal baseado no <dialog> nativo: o navegador cuida do foco preso, do
// ESC e de tornar o restante da página inerte. `open` é controlado pelo pai.
// size: sm | md | lg. No celular vira uma folha ancorada embaixo.
function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  dismissible = true,
  children,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return undefined;

    if (open && !dialog.open) {
      dialog.showModal();
      // O foco inicial nativo vai para o 1º controle (o botão Fechar). Quem
      // precisar de outro destino marca o elemento com data-autofocus.
      dialog.querySelector('[data-autofocus]')?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return undefined;
  }, [open]);

  // Trava a rolagem da página enquanto o modal está aberto.
  useEffect(() => {
    if (!open) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function handleCancel(event) {
    // ESC: o estado quem manda, o pai decide fechar.
    event.preventDefault();

    if (dismissible) onClose();
  }

  function handleBackdropClick(event) {
    if (dismissible && event.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={cx('ui-dialog', size !== 'md' && `ui-dialog--${size}`)}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      {open && (
        <div className="ui-dialog__panel">
          <div className="ui-dialog__header">
            <div>
              <h2 className="ui-dialog__title" id={titleId}>
                {title}
              </h2>
              {description && (
                <p className="ui-dialog__description" id={descriptionId}>
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <IconButton icon="x" label="Fechar" size="sm" onClick={onClose} />
            )}
          </div>

          {children && <div className="ui-dialog__body">{children}</div>}
          {footer && <div className="ui-dialog__footer">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export default Dialog;

// Substitui window.confirm: o foco inicial vai para "Cancelar" (ação segura).
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading} data-autofocus>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
