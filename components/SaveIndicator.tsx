'use client';

interface SaveIndicatorProps {
  show: boolean;
}

export default function SaveIndicator({ show }: SaveIndicatorProps) {
  return (
    <div className={`save-indicator ${show ? 'show' : ''}`}>
      Changes saved
    </div>
  );
}
