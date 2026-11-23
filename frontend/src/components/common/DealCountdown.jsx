import React, { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';

const getTimeUntil = (expiresAt) => {
  const seconds = Math.ceil((expiresAt - Date.now()) / 1000);
  if (seconds <= 0) return null;

  const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const remainingSeconds = String(seconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${remainingSeconds}`;
};

function DealCountdown({ discountPrice, className = '' }) {
  const hasDiscount = discountPrice !== null && discountPrice !== undefined;
  const [expiresAt] = useState(() => {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime();
  });
  const [remaining, setRemaining] = useState(() => getTimeUntil(expiresAt));

  useEffect(() => {
    if (!hasDiscount) return undefined;
    let interval;
    const updateCountdown = () => {
      const next = getTimeUntil(expiresAt);
      setRemaining(next);
      if (next === null) window.clearInterval(interval);
    };
    interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt, hasDiscount]);

  if (!hasDiscount || remaining === null) return null;

  return (
    <p className={`deal-countdown ${className}`.trim()}>
      <Clock3 size={13} aria-hidden="true" />
      <span>Limited time offer ends in <strong>{remaining}</strong></span>
    </p>
  );
}

export default DealCountdown;
