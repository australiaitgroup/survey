interface CloudinaryResponse {
	secure_url: string;
	public_id: string;
	format: string;
	width: number;
	height: number;
}

interface CloudinaryUploadOptions {
	cloudName: string;
	uploadPreset: string;
	maxFileSize?: number; // in bytes, default 10MB
	allowedFormats?: string[]; // default: ['jpg', 'jpeg', 'png', 'gif', 'webp']
}

/**
 * Upload image to Cloudinary using unsigned upload
 */
export const uploadToCloudinary = async (
	file: File,
	options: CloudinaryUploadOptions
): Promise<string> => {
	const {
		cloudName,
		uploadPreset,
		maxFileSize = 10 * 1024 * 1024, // 10MB default
		allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'],
	} = options;

	// Validate file type
	if (!file.type.startsWith('image/')) {
		throw new Error('Please select an image file');
	}

	// Validate file size
	if (file.size > maxFileSize) {
		const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
		throw new Error(`Image size must be less than ${maxSizeMB}MB`);
	}

	// Validate file format
	const fileExtension = file.name.split('.').pop()?.toLowerCase();
	if (fileExtension && !allowedFormats.includes(fileExtension)) {
		throw new Error(`Supported formats: ${allowedFormats.join(', ')}`);
	}

	// Prepare form data
	const formData = new FormData();
	formData.append('file', file);
	formData.append('upload_preset', uploadPreset);

	try {
		const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(
				errorData?.error?.message || `Upload failed with status: ${response.status}`
			);
		}

		const data: CloudinaryResponse = await response.json();

		if (!data.secure_url) {
			throw new Error('Upload successful but no image URL received');
		}

		return data.secure_url;
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error('Failed to upload image. Please try again.');
	}
};

/**
 * Get Cloudinary configuration from environment or default values
 */
export const getCloudinaryConfig = (): CloudinaryUploadOptions => {
	// You can set these values in your environment variables or config
	const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
	const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset';

	if (cloudName === 'your-cloud-name' || uploadPreset === 'your-upload-preset') {
		console.warn(
			'⚠️  Cloudinary configuration not found. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET environment variables.'
		);
	}

	return {
		cloudName,
		uploadPreset,
		maxFileSize: 10 * 1024 * 1024, // 10MB
		allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
	};
};
