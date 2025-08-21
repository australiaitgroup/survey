import React from 'react';

interface ModalProps {
	show: boolean;
	title?: string;
	onClose: () => void;
	children: React.ReactNode;
	size?: 'small' | 'medium' | 'large' | 'xlarge';
}

const Modal: React.FC<ModalProps> = ({ show, title, onClose, children, size = 'medium' }) => {
	if (!show) return null;

	const sizeClasses = {
		small: 'max-w-md',
		medium: 'max-w-2xl',
		large: 'max-w-4xl',
		xlarge: 'max-w-6xl',
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
			<div
				className={`bg-white rounded-xl shadow-xl ${sizeClasses[size]} w-full p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto`}
			>
				<button
					className='absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none'
					onClick={onClose}
					aria-label='Close'
				>
					×
				</button>
				{title && <h2 className='text-xl font-bold mb-4 text-gray-800'>{title}</h2>}
				<div>{children}</div>
			</div>
		</div>
	);
};

export default Modal;
