export function getInitials(name = '') {
  if (!name) return '?';
  const clean = name.replace(/\(.*\)/, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || '?';
}

export function getAvatarColor(name = '') {
  const colors = [
    'bg-[#e50914] text-white',
    'bg-zinc-800 text-zinc-200 border border-white/10',
    'bg-zinc-700 text-zinc-100 border border-white/10',
    'bg-zinc-900 text-zinc-300 border border-white/15',
    'bg-zinc-800 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
