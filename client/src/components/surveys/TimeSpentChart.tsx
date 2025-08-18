import React from 'react';

type Bin = {
  label: string;
  min: number; // inclusive, in seconds
  max: number; // exclusive, in seconds; use Infinity for open-ended
};

const DEFAULT_BINS: Bin[] = [
  { label: '<30s', min: 0, max: 30 },
  { label: '30–60s', min: 30, max: 60 },
  { label: '1–2m', min: 60, max: 120 },
  { label: '2–5m', min: 120, max: 300 },
  { label: '5–10m', min: 300, max: 600 },
  { label: '10m+', min: 600, max: Infinity },
];

export interface TimeSpentChartProps {
  seconds: Array<number | undefined | null>;
  bins?: Bin[];
  height?: number;
}

const TimeSpentChart: React.FC<TimeSpentChartProps> = ({ seconds, bins = DEFAULT_BINS, height = 160 }) => {
  const counts = React.useMemo(() => {
    const c = new Array(bins.length).fill(0) as number[];
    for (const s of seconds) {
      const val = typeof s === 'number' && !Number.isNaN(s) && s >= 0 ? s : undefined;
      if (val === undefined) continue;
      const idx = bins.findIndex(b => val >= b.min && val < b.max);
      if (idx >= 0) c[idx] += 1;
    }
    return c;
  }, [seconds, bins]);

  const maxCount = Math.max(1, ...counts);
  const barWidthPct = 100 / bins.length;

  return (
    <div className='w-full'>
      <div className='flex items-end gap-2 h-40 sm:h-48 md:h-56'>
        {counts.map((count, i) => {
          const hPct = (count / maxCount) * 100;
          return (
            <div key={bins[i].label} className='flex-1 flex flex-col items-center justify-end'>
              <div className='w-full bg-blue-100 rounded-t-md' style={{ height: `${Math.max(6, (hPct / 100) * height)}px` }}>
                <div className='w-full h-full bg-blue-500 rounded-t-md transition-all' />
              </div>
              <div className='mt-1 text-xs text-gray-600'>{count}</div>
              <div className='mt-0.5 text-xs text-gray-700 text-center'>{bins[i].label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSpentChart;
