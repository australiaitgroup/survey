import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DrawerProps {
	show: boolean;
	title?: string;
	onClose: () => void;
	children: React.ReactNode;
	actions?: React.ReactNode;
}

const Drawer: React.FC<DrawerProps> = ({ show, title, onClose, children, actions }) => {
	// Close drawer on Escape key
	useEffect(() => {
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && show) {
				onClose();
			}
		};

		if (show) {
			document.addEventListener('keydown', handleEscapeKey);
			// Prevent body scroll when drawer is open
			document.body.style.overflow = 'hidden';
		}

		return () => {
			document.removeEventListener('keydown', handleEscapeKey);
			document.body.style.overflow = 'unset';
		};
	}, [show, onClose]);

	if (!show) return null;

	return (
		<div className='fixed inset-0 z-50'>
			{/* Backdrop */}
			<div
				className='absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300'
				onClick={onClose}
			/>

			{/* Drawer */}
			<div className='absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out transform translate-y-0 animate-slide-up'>
				<div className='h-[90vh] flex flex-col'>
					{/* Drawer Header */}
					<div className='flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl'>
						<div className='flex items-center justify-between'>
							{/* Drag Handle */}
							<div className='w-12 h-1 bg-gray-300 rounded-full mx-auto absolute left-1/2 transform -translate-x-1/2 -top-3'></div>

							{title && (
								<h2 className='text-xl font-semibold text-[#484848] flex-1'>
									{title}
								</h2>
							)}

							<button
								onClick={onClose}
								className='ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200'
								aria-label='Close drawer'
							>
								<XMarkIcon className='w-5 h-5' />
							</button>
						</div>
					</div>

					{/* Drawer Content */}
					<div className='flex-1 overflow-y-auto p-6'>{children}</div>

					{/* Fixed Action Area */}
					{actions && (
						<div className='flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-white'>
							{actions}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Drawer;
