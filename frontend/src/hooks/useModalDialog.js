import { useEffect } from 'react';

// Comportamento compartilhado por Dialog e Drawer, ambos baseados no <dialog>
// nativo: abre/fecha conforme `open` (controlado pelo pai), leva o foco para o
// elemento marcado com data-autofocus e trava a rolagem da página.
// O navegador cuida do foco preso, do ESC e de tornar o resto da página inerte.
export default function useModalDialog(dialogRef, open) {
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      // O foco inicial nativo vai para o 1º controle. Quem precisar de outro
      // destino marca o elemento com data-autofocus.
      dialog.querySelector('[data-autofocus]')?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [dialogRef, open]);

  useEffect(() => {
    if (!open) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
}
