import React from 'react';

interface Props {
	remainingMs: number;
	remainingPct: number; // 0..1
	totalSeconds?: number; // optional for display override
}

const SIZE = 80;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export const RadialCountdown: React.FC<Props> = ({ remainingMs, remainingPct }) => {
	const seconds = Math.ceil(remainingMs / 1000);
	const dashOffset = CIRC * (1 - remainingPct);
	return (
		<div className='flex flex-col items-center justify-center'>
			<svg width={SIZE} height={SIZE} className='rotate-[-90deg]'>
				<circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke='#e5e7eb' strokeWidth={STROKE} fill='none' />
				<circle
					cx={SIZE / 2}
					cy={SIZE / 2}
					r={RADIUS}
					stroke='#10b981'
					strokeWidth={STROKE}
					fill='none'
					strokeDasharray={`${CIRC} ${CIRC}`}
					strokeDashoffset={dashOffset}
					strokeLinecap='round'
				/>
			</svg>
			<div className='-mt-14 text-center w-16 select-none'>
				<div className='text-lg font-semibold'>{Math.max(0, seconds)}</div>
				<div className='text-[10px] text-gray-500'>sec</div>
			</div>
		</div>
	);
};

export default RadialCountdown;

