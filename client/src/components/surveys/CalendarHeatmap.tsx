import React from 'react';

export type HeatmapDatum = { date: string; value: number };

type Props = {
	data: HeatmapDatum[];
	weeks?: number; // how many weeks to render (columns)
	title?: string;
	valueLabel?: (v: number) => string;
};

function toDateOnlyString(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

const CalendarHeatmap: React.FC<Props> = ({ data, weeks = 20, title, valueLabel }) => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Build a map yyyy-mm-dd -> value
	const map = React.useMemo(() => {
		const m = new Map<string, number>();
		data.forEach(d => {
			if (!d || !d.date) return;
			const key = d.date;
			const v = Number.isFinite(d.value) ? d.value : 0;
			m.set(key, (m.get(key) || 0) + v);
		});
		return m;
	}, [data]);

	// Determine max for color scaling
	const maxValue = React.useMemo(() => {
		let max = 0;
		map.forEach(v => {
			if (v > max) max = v;
		});
		return Math.max(max, 1);
	}, [map]);

	// Build grid columns for the last N weeks
	const columns: { date: Date; key: string }[][] = [];
	for (let w = weeks - 1; w >= 0; w--) {
		const col: { date: Date; key: string }[] = [];
		for (let dow = 0; dow < 7; dow++) {
			const d = new Date(today);
			const offset = w * 7 + (6 - today.getDay()) + dow - 6; // align last column ending today
			d.setDate(d.getDate() - offset);
			d.setHours(0, 0, 0, 0);
			col.push({ date: d, key: toDateOnlyString(d) });
		}
		columns.push(col);
	}

	const colorFor = (v: number) => {
		if (v <= 0) return 'bg-gray-100';
		const r = v / maxValue; // 0..1
		if (r < 0.2) return 'bg-blue-100';
		if (r < 0.4) return 'bg-blue-200';
		if (r < 0.6) return 'bg-blue-300';
		if (r < 0.8) return 'bg-blue-400';
		return 'bg-blue-600';
	};

	// Tooltip state
	const [tooltip, setTooltip] = React.useState<{
		x: number;
		y: number;
		text: string;
		visible: boolean;
	}>({ x: 0, y: 0, text: '', visible: false });
	const onEnter = (e: React.MouseEvent<HTMLDivElement>, key: string, v: number) => {
		const label = valueLabel ? valueLabel(v) : String(v);
		setTooltip({
			x: e.clientX + 12,
			y: e.clientY + 12,
			text: `${key}  ${label}`,
			visible: true,
		});
	};
	const onMove = (e: React.MouseEvent<HTMLDivElement>) =>
		setTooltip(prev => ({ ...prev, x: e.clientX + 12, y: e.clientY + 12 }));
	const onLeave = () => setTooltip(prev => ({ ...prev, visible: false }));

	// Month labels (top) + weekday labels (left)
	const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const monthShort = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];
	const monthLabels = columns.map(col => monthShort[col[0].date.getMonth()]);
	const dedupMonth = monthLabels.map((m, i) => (i === 0 || m !== monthLabels[i - 1] ? m : ''));

	return (
		<div className='relative'>
			{title && <h5 className='font-semibold text-gray-800 mb-2'>{title}</h5>}
			{/* Months */}
			<div className='flex gap-1 pl-6 mb-1 text-[10px] text-gray-500'>
				{dedupMonth.map((m, i) => (
					<div key={i} className='w-3 sm:w-3.5 md:w-4 text-center'>
						{m}
					</div>
				))}
			</div>
			<div className='flex gap-1 overflow-x-auto py-1'>
				{/* Weekdays */}
				<div className='flex flex-col gap-1 mr-1 text-[10px] text-gray-500'>
					{weekday.map((d, i) => (
						<div
							key={i}
							className='h-3 sm:h-3.5 md:h-4 leading-3 sm:leading-3.5 md:leading-4 flex items-center'
						>
							{i % 2 === 0 ? d : ''}
						</div>
					))}
				</div>
				{/* Grid */}
				{columns.map((col, ci) => (
					<div key={ci} className='flex flex-col gap-1'>
						{col.map(({ date, key }, ri) => {
							const v = map.get(key) || 0;
							return (
								<div
									key={ri}
									onMouseEnter={e => onEnter(e, key, v)}
									onMouseMove={onMove}
									onMouseLeave={onLeave}
									onClick={() =>
										setTooltip(prev => ({
											...prev,
											text: `${key}  ${valueLabel ? valueLabel(v) : v}`,
											visible: true,
										}))
									}
									className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rounded ${colorFor(v)}`}
									aria-label={`${key}: ${valueLabel ? valueLabel(v) : v}`}
								/>
							);
						})}
					</div>
				))}
			</div>
			<div className='flex items-center gap-2 mt-2 text-xs text-gray-500'>
				<span>Less</span>
				<div className='w-3 h-3 rounded bg-gray-100' />
				<div className='w-3 h-3 rounded bg-blue-100' />
				<div className='w-3 h-3 rounded bg-blue-300' />
				<div className='w-3 h-3 rounded bg-blue-400' />
				<div className='w-3 h-3 rounded bg-blue-600' />
				<span>More</span>
			</div>
			{tooltip.visible && (
				<div
					className='fixed z-50 px-2 py-1 text-xs bg-black/80 text-white rounded pointer-events-none'
					style={{ left: tooltip.x, top: tooltip.y }}
				>
					{tooltip.text}
				</div>
			)}
			{/* Optional pinned details row */}
			<div className='mt-1 text-[11px] text-gray-600'>
				Hover or tap a cell to see exact date (YYYY-MM-DD) and value.
			</div>
		</div>
	);
};

export default CalendarHeatmap;
