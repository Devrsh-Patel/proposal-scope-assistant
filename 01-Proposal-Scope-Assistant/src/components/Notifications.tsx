import type { ReactNode } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { AppNotification } from '../types';

const icons: Record<AppNotification['type'], ReactNode> = {
  success: <CheckCircle style={{ color: 'var(--success-fg)' }} />,
  warning: <AlertTriangle style={{ color: 'var(--warning-fg)' }} />,
  info:    <Info         style={{ color: 'var(--info-fg)' }} />,
  error:   <XCircle      style={{ color: 'var(--danger-fg)' }} />,
};

export default function Notifications() {
  const { notifications, dismissNotification } = useAppStore();

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container" role="alert" aria-live="polite">
      {notifications.map((n) => (
        <div key={n.id} className={`notification notification-${n.type}`}>
          <span className="notification-icon" aria-hidden="true">{icons[n.type]}</span>
          <p className="notification-msg">{n.message}</p>
          <button
            className="btn btn-ghost btn-sm notification-close"
            onClick={() => dismissNotification(n.id)}
            aria-label="Dismiss notification"
          >
            <X aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
