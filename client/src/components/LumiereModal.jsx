import { useEffect } from 'react';

export default function LumiereModal({ show, onHide, title, children, footer, width }) {
  useEffect(() => {
    if (!show) return;
    const onKey = (e) => { if (e.key === 'Escape') onHide?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="moverlay on" onClick={(e) => { if (e.target === e.currentTarget) onHide?.(); }}>
      <div className="modal" style={width ? { width } : undefined}>
        {title && <div className="modaltitle">{title}</div>}
        {children}
        {footer && <div className="macts">{footer}</div>}
      </div>
    </div>
  );
}
