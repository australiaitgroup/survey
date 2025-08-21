import React, { useState, useRef } from 'react';
import api from '../../utils/axiosConfig';
import { uploadToCloudinary, getCloudinaryConfig } from '../../utils/cloudinaryUpload';

interface ImageUploadProps {
	onImageUpload: (imageUrl: string) => void;
	onImageRemove: () => void;
	placeholder?: string;
	className?: string;
	imageUrl?: string | null;
	/**
	 * Upload method: 'backend' (default) or 'cloudinary'
	 */
	uploadMethod?: 'backend' | 'cloudinary';
	/**
	 * Cloudinary configuration (only used when uploadMethod is 'cloudinary')
	 */
	cloudinaryConfig?: {
		cloudName?: string;
		uploadPreset?: string;
		maxFileSize?: number;
		allowedFormats?: string[];
	};
}

const ImageUpload: React.FC<ImageUploadProps> = ({
	imageUrl,
	onImageUpload,
	onImageRemove,
	placeholder = 'Click to upload image or paste URL',
	className = '',
	uploadMethod = 'backend',
	cloudinaryConfig,
}) => {
	const [isUploading, setIsUploading] = useState(false);
	const [showUrlInput, setShowUrlInput] = useState(false);
	const [urlInput, setUrlInput] = useState('');
	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = async (file: File) => {
		setIsUploading(true);
		try {
			let imageUrl: string;

			if (uploadMethod === 'cloudinary') {
				// Use Cloudinary upload
				const config = cloudinaryConfig
					? { ...getCloudinaryConfig(), ...cloudinaryConfig }
					: getCloudinaryConfig();

				imageUrl = await uploadToCloudinary(file, config);
			} else {
				// Use backend upload (original method)
				if (!file.type.startsWith('image/')) {
					throw new Error('Please select an image file');
				}

				if (file.size > 10 * 1024 * 1024) {
					throw new Error('Image size must be less than 10MB');
				}

				const formData = new FormData();
				formData.append('image', file);

				const response = await api.post('/admin/upload-image', formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				});

				if (response.data.success && response.data.imageUrl) {
					imageUrl = response.data.imageUrl;
				} else {
					throw new Error('Upload failed');
				}
			}

			onImageUpload(imageUrl);
		} catch (error) {
			console.error('Image upload error:', error);
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to upload image. Please try again.';
			alert(errorMessage);
		} finally {
			setIsUploading(false);
		}
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragOver(false);

		const file = e.dataTransfer.files[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragOver(false);
	};

	const handleUrlSubmit = () => {
		if (urlInput.trim()) {
			// Basic URL validation
			try {
				new URL(urlInput);
				onImageUpload(urlInput.trim());
				setUrlInput('');
				setShowUrlInput(false);
			} catch {
				alert('Please enter a valid URL');
			}
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		const items = e.clipboardData?.items;
		if (!items) return;

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			// Handle image files
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile();
				if (file) {
					handleFileSelect(file);
					e.preventDefault();
					return;
				}
			}

			// Handle text (URLs)
			if (item.type === 'text/plain') {
				item.getAsString(text => {
					try {
						new URL(text);
						if (text.match(/\.(jpg|jpeg|png|gif|webp)$/i) || text.includes('image')) {
							onImageUpload(text.trim());
						}
					} catch {
						// Not a valid URL, ignore
					}
				});
			}
		}
	};

	if (imageUrl) {
		return (
			<div className={`relative ${className}`}>
				<img
					src={imageUrl}
					alt='Uploaded content'
					className='w-full h-32 object-cover rounded-lg border border-gray-300'
					onError={e => {
						e.currentTarget.src =
							'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDlWN0M2IDcgNCA5IDQgOVYxN0M0IDE5IDYgMjEgOSAyMUgxNUMxNyAyMSAxOSAxOSAxOSAxN1YxNUwyMSA5WiIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOSA5SDE1VjE1SDlaIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvcGF0aD4KPC9zdmc+';
					}}
				/>
				<button
					type='button'
					onClick={onImageRemove}
					className='absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors'
					title='Remove image'
				>
					×
				</button>
			</div>
		);
	}

	return (
		<div className={className}>
			<div
				className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
					dragOver
						? 'border-blue-400 bg-blue-50'
						: 'border-gray-300 hover:border-gray-400'
				} ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onClick={() => fileInputRef.current?.click()}
				onPaste={handlePaste}
				tabIndex={0}
			>
				{isUploading ? (
					<div className='flex flex-col items-center'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2'></div>
						<p className='text-sm text-gray-600'>Uploading...</p>
					</div>
				) : (
					<div className='flex flex-col items-center'>
						<svg
							className='w-8 h-8 text-gray-400 mb-2'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
							/>
						</svg>
						<p className='text-sm text-gray-600 mb-2'>{placeholder}</p>
						<p className='text-xs text-gray-500'>
							Drag & drop, click to select, or paste (Ctrl+V)
						</p>
					</div>
				)}
			</div>

			<div className='mt-2 flex gap-2'>
				<button
					type='button'
					onClick={() => setShowUrlInput(!showUrlInput)}
					className='text-xs text-blue-600 hover:text-blue-800 underline'
				>
					{showUrlInput ? 'Hide URL input' : 'Or paste URL'}
				</button>
			</div>

			{showUrlInput && (
				<div className='mt-2 flex gap-2'>
					<input
						type='url'
						className='input-field flex-1 text-sm'
						placeholder='Paste image URL here'
						value={urlInput}
						onChange={e => setUrlInput(e.target.value)}
						onKeyPress={e => {
							if (e.key === 'Enter') {
								handleUrlSubmit();
							}
						}}
					/>
					<button
						type='button'
						onClick={handleUrlSubmit}
						className='btn-secondary text-sm px-3 py-1'
						disabled={!urlInput.trim()}
					>
						Add
					</button>
				</div>
			)}

			<input
				ref={fileInputRef}
				type='file'
				accept='image/*'
				onChange={handleFileInputChange}
				className='hidden'
			/>
		</div>
	);
};

export default ImageUpload;
