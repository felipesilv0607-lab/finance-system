import { useId, useRef } from 'react';
import useModalDialog from '../../hooks/useModalDialog';
import IconButton from './IconButton';

// Gaveta lateral (menu no tablet/celular) sobre o <dialog> nativo: foco preso,
// ESC, rolagem da página travada e restante da página inerte. Clicar fora
// (no backdrop) fecha. `open` é controlado pelo pai.
function Drawer({ open, onClose, label, children }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useModalDialog(dialogRef, open);

  function handleCancel(event) {
    event.preventDefault();
    onClose();
  }

  function handleBackdropClick(event) {
    if (event.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="ui-drawer"
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      {open && (
        <div className="ui-drawer__panel">
          <h2 className="sr-only" id={titleId}>
            {label}
          </h2>
          <IconButton
            icon="x"
            label="Fechar menu"
            size="sm"
            className="ui-drawer__close"
            onClick={onClose}
          />
          {children}
        </div>
      )}
    </dialog>
  );
}

export default Drawer;
