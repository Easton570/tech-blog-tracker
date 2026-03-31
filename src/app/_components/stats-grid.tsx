interface StatItem {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'default' | 'green' | 'amber' | 'red' | 'cyan';
}

export function StatsGrid({ stats }: { stats: StatItem[] }) {
  const colorMap = {
    default: 'text-text-primary',
    green: 'text-terminal-green',
    amber: 'text-terminal-amber',
    red: 'text-terminal-red',
    cyan: 'text-terminal-cyan',
  };

  const glowMap = {
    default: '',
    green: 'shadow-[0_0_30px_-10px_rgba(0,255,136,0.15)]',
    amber: 'shadow-[0_0_30px_-10px_rgba(255,184,0,0.15)]',
    red: 'shadow-[0_0_30px_-10px_rgba(255,51,68,0.15)]',
    cyan: 'shadow-[0_0_30px_-10px_rgba(0,229,255,0.15)]',
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`panel p-4 ${glowMap[stat.color || 'default']}`}
        >
          <p className="data-label mb-2">{stat.label}</p>
          <p className={`font-mono text-2xl font-semibold tracking-tight ${colorMap[stat.color || 'default']}`}>
            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
          </p>
          {stat.sub && (
            <p className="font-mono text-[10px] text-text-dim mt-1">{stat.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
