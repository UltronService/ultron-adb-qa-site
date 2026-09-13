import type { ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ open, title, onClose, children }: DrawerProps) {
  if (!open) {
    return null;
  }
  return (
    <div className="overlay overlay--drawer" role="presentation" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="drawer__header">
          <h2 id="drawer-title">{title}</h2>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            關閉
          </button>
        </header>
        <div className="drawer__body">{children}</div>
      </aside>
    </div>
  );
}
