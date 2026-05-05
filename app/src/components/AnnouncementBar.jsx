import { motion } from 'framer-motion';
import { useAnnouncements } from '../context/AnnouncementsContext';

export default function AnnouncementBar({ page }) {
  const { bars, loaded } = useAnnouncements();
  if (!loaded) return null;
  const bar = bars[page];
  if (!bar || !bar.active || !bar.items.length) return null;

  const sep = bar.separator || '✦';
  // Duplicate items for seamless loop
  const all = [...bar.items, sep, ...bar.items, sep];

  const bg = `linear-gradient(${bar.bgDir || '135deg'}, ${bar.bgFrom}, ${bar.bgTo})`;

  return (
    <div style={{ background: bg, padding: '11px 0', overflow: 'hidden', flexShrink: 0 }}>
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: bar.speed, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'flex', gap: 28, width: 'max-content', alignItems: 'center' }}
      >
        {all.map((item, i) => (
          <span
            key={i}
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '2.5px',
              color: bar.textColor || '#ffffff',
              whiteSpace: 'nowrap', textTransform: 'uppercase',
              opacity: item === sep ? 0.6 : 1,
            }}
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
