import React from 'react';

interface PerQuestionTimeLineChartProps {
	/** Seconds spent per question, in order */
	times: Array<number | undefined | null>;
	height?: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const PerQuestionTimeLineChart: React.FC<PerQuestionTimeLineChartProps> = ({
	times,
	height = 180,
}) => {
	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const normalized = React.useMemo(
		() => times.map(v => (typeof v === 'number' && v >= 0 && Number.isFinite(v) ? v : 0)),
		[times]
	);
	const maxY = Math.max(1, ...normalized);
	const width = 640; // render space; container is responsive via viewBox
	const padding = { top: 16, right: 16, bottom: 24, left: 36 };
	const innerW = width - padding.left - padding.right;
	const innerH = height - padding.top - padding.bottom;
	const n = Math.max(1, normalized.length);

	const xFor = (i: number) => (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
	const yFor = (v: number) => innerH - (v / maxY) * innerH;

	const pointsList = normalized.map((v, i) => ({
		x: padding.left + xFor(i),
		y: padding.top + yFor(v),
		v,
		i,
	}));
	const points = pointsList.map(p => `${p.x},${p.y}`).join(' ');

	const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
	const [tooltip, setTooltip] = React.useState<{ x: number; y: number; label: string } | null>(
		null
	);

	const handleMouseMove: React.MouseEventHandler<SVGSVGElement> = e => {
		const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
		const scaleX = width / rect.width;
		const scaleY = height / rect.height;
		const localX = (e.clientX - rect.left) * scaleX;
		const localY = (e.clientY - rect.top) * scaleY;
		// find nearest point by X
		let nearest = 0;
		let best = Infinity;
		for (let i = 0; i < pointsList.length; i++) {
			const dx = Math.abs(pointsList[i].x - localX);
			if (dx < best) {
				best = dx;
				nearest = i;
			}
		}
		setHoverIdx(nearest);
		const p = pointsList[nearest];
		setTooltip({ x: p.x, y: p.y, label: `Q${p.i + 1}: ${Math.round(p.v)}s` });
	};

	const handleMouseLeave = () => {
		setHoverIdx(null);
		setTooltip(null);
	};

	const ticksY = 4;
	const yTicks = new Array(ticksY + 1).fill(0).map((_, idx) => {
		const yVal = (idx / ticksY) * maxY;
		const y = padding.top + yFor(yVal);
		return { y, yVal };
	});

	return (
		<div ref={containerRef} className='w-full relative'>
			<svg
				viewBox={`0 0 ${width} ${height}`}
				className='w-full h-auto'
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
			>
				{/* Axes */}
				<line
					x1={padding.left}
					y1={padding.top}
					x2={padding.left}
					y2={padding.top + innerH}
					stroke='#e5e7eb'
				/>
				<line
					x1={padding.left}
					y1={padding.top + innerH}
					x2={padding.left + innerW}
					y2={padding.top + innerH}
					stroke='#e5e7eb'
				/>

				{/* Y ticks and labels */}
				{yTicks.map((t, i) => (
					<g key={i}>
						<line
							x1={padding.left}
							x2={padding.left + innerW}
							y1={t.y}
							y2={t.y}
							stroke='#f3f4f6'
						/>
						<text
							x={padding.left - 8}
							y={t.y}
							textAnchor='end'
							dominantBaseline='middle'
							fontSize='10'
							fill='#6b7280'
						>
							{Math.round(t.yVal)}s
						</text>
					</g>
				))}

				{/* X labels (sparse to avoid clutter) */}
				{normalized.map((_, i) => {
					const show =
						i === 0 || i === n - 1 || (n > 12 ? i % Math.ceil(n / 12) === 0 : true);
					if (!show) return null;
					const x = padding.left + xFor(i);
					return (
						<text
							key={i}
							x={x}
							y={padding.top + innerH + 14}
							textAnchor='middle'
							fontSize='10'
							fill='#6b7280'
						>
							Q{i + 1}
						</text>
					);
				})}

				{/* Line path */}
				{normalized.length > 0 && (
					<polyline points={points} fill='none' stroke='#3b82f6' strokeWidth={2} />
				)}

				{/* Points */}
				{pointsList.map((p, i) => (
					<circle
						key={i}
						cx={p.x}
						cy={p.y}
						r={hoverIdx === i ? 4.5 : 3}
						fill={hoverIdx === i ? '#1d4ed8' : '#3b82f6'}
					/>
				))}
			</svg>

			{/* Tooltip */}
			{tooltip && (
				<div
					className='pointer-events-none absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow'
					style={{
						left: `calc(${(tooltip.x / width) * 100}% + 8px)`,
						top: `calc(${(tooltip.y / height) * 100}% - 8px)`,
						transform: 'translate(-50%, -100%)',
						whiteSpace: 'nowrap',
					}}
				>
					{tooltip.label}
				</div>
			)}
		</div>
	);
};

export default PerQuestionTimeLineChart;
