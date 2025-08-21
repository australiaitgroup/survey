import React from 'react';
import type { UserResponse } from '../../types/admin';

interface DeviceData {
	name: string;
	count: number;
	percentage: number;
	color: string;
}

interface DeviceChartProps {
	responses: UserResponse[];
}

const DEVICE_COLORS = {
	mobile: '#3B82F6', // blue
	desktop: '#10B981', // green
	tablet: '#F59E0B', // amber
	unknown: '#6B7280', // gray
};

const DeviceChart: React.FC<DeviceChartProps> = ({ responses }) => {
	// Parse device information from userAgent and deviceType
	const getDeviceType = (response: UserResponse): string => {
		const metadata = response.metadata;

		// First check if deviceType is explicitly set
		if (metadata?.deviceType) {
			return metadata.deviceType.toLowerCase();
		}

		// Fallback to parsing userAgent
		const userAgent = metadata?.userAgent?.toLowerCase() || '';

		if (
			userAgent.includes('mobile') ||
			userAgent.includes('android') ||
			userAgent.includes('iphone')
		) {
			return 'mobile';
		} else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
			return 'tablet';
		} else if (
			userAgent.includes('windows') ||
			userAgent.includes('mac') ||
			userAgent.includes('linux')
		) {
			return 'desktop';
		}

		return 'unknown';
	};

	// Get device name for display
	const getDeviceName = (response: UserResponse): string => {
		const userAgent = response.metadata?.userAgent?.toLowerCase() || '';

		// Detailed device identification
		if (userAgent.includes('iphone')) {
			if (userAgent.includes('iphone os 17') || userAgent.includes('version/17'))
				return 'iPhone (iOS 17)';
			if (userAgent.includes('iphone os 16') || userAgent.includes('version/16'))
				return 'iPhone (iOS 16)';
			if (userAgent.includes('iphone os 15') || userAgent.includes('version/15'))
				return 'iPhone (iOS 15)';
			return 'iPhone';
		}
		if (userAgent.includes('android')) {
			if (userAgent.includes('samsung')) return 'Android (Samsung)';
			if (userAgent.includes('pixel')) return 'Android (Google Pixel)';
			if (userAgent.includes('huawei')) return 'Android (Huawei)';
			if (userAgent.includes('xiaomi')) return 'Android (Xiaomi)';
			return 'Android';
		}
		if (userAgent.includes('ipad')) return 'iPad';
		if (userAgent.includes('windows')) {
			if (userAgent.includes('windows nt 10')) return 'Windows 10/11';
			if (userAgent.includes('windows nt 6')) return 'Windows 7/8';
			return 'Windows';
		}
		if (userAgent.includes('mac')) {
			if (userAgent.includes('intel')) return 'Mac (Intel)';
			if (userAgent.includes('arm')) return 'Mac (Apple Silicon)';
			return 'Mac';
		}
		if (userAgent.includes('linux')) return 'Linux';
		if (userAgent.includes('chrome')) return 'Chrome Browser';
		if (userAgent.includes('firefox')) return 'Firefox Browser';
		if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari Browser';

		const deviceType = getDeviceType(response);
		return deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
	};

	// Aggregate device data
	const deviceStats = React.useMemo(() => {
		const deviceCounts: Record<string, number> = {};
		const deviceNames: Record<string, Set<string>> = {};

		responses.forEach(response => {
			const deviceType = getDeviceType(response);
			const deviceName = getDeviceName(response);

			deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;

			if (!deviceNames[deviceType]) {
				deviceNames[deviceType] = new Set();
			}
			deviceNames[deviceType].add(deviceName);
		});

		const total = responses.length;

		return Object.entries(deviceCounts)
			.map(([type, count]) => ({
				name: Array.from(deviceNames[type]).join(', '),
				type,
				count,
				percentage: Math.round((count / total) * 100),
				color: DEVICE_COLORS[type as keyof typeof DEVICE_COLORS] || DEVICE_COLORS.unknown,
			}))
			.sort((a, b) => b.count - a.count);
	}, [responses]);

	if (deviceStats.length === 0) {
		return (
			<div className='flex items-center justify-center h-32 text-gray-500'>
				<p>No device data available</p>
			</div>
		);
	}

	// Create simple pie chart using CSS
	let cumulativePercentage = 0;

	return (
		<div className='space-y-4'>
			{/* Simple pie chart representation */}
			<div className='flex justify-center'>
				<div
					className='relative w-32 h-32 rounded-full overflow-hidden'
					style={{
						background: `conic-gradient(${deviceStats
							.map((device, index) => {
								const startPercent = cumulativePercentage;
								cumulativePercentage += device.percentage;
								return `${device.color} ${startPercent}% ${cumulativePercentage}%`;
							})
							.join(', ')})`,
					}}
				>
					<div className='absolute inset-4 bg-white rounded-full flex items-center justify-center'>
						<div className='text-center'>
							<div className='text-lg font-bold text-gray-800'>
								{responses.length}
							</div>
							<div className='text-xs text-gray-600'>Total</div>
						</div>
					</div>
				</div>
			</div>

			{/* Legend */}
			<div className='space-y-2'>
				{deviceStats.map((device, index) => (
					<div key={index} className='flex items-center justify-between text-sm'>
						<div className='flex items-center gap-2'>
							<div
								className='w-3 h-3 rounded-full flex-shrink-0'
								style={{ backgroundColor: device.color }}
							/>
							<span className='text-gray-700'>{device.name}</span>
						</div>
						<div className='text-gray-600'>
							{device.count} ({device.percentage}%)
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default DeviceChart;
