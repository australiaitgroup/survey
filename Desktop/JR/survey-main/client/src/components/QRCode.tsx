import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeProps {
	url: string;
	size?: number;
}

const QRCodeComponent: React.FC<QRCodeProps> = ({ url, size = 200 }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (canvasRef.current) {
			QRCode.toCanvas(canvasRef.current, url, {
				width: size,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#FFFFFF',
				},
			});
		}
	}, [url, size]);

	return (
		<div className='text-center'>
			<canvas ref={canvasRef} className='mx-auto' />
			<p className='text-sm text-gray-600 mt-2'>Scan to access survey</p>
		</div>
	);
};

export default QRCodeComponent;
