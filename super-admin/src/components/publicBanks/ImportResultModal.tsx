import React from 'react';

interface ImportResultModalProps {
	isOpen: boolean;
	onClose: () => void;
	result: {
		success: boolean;
		message: string;
		imported: number;
		warnings?: string[];
		errors?: string[];
	} | null;
}

const ImportResultModal: React.FC<ImportResultModalProps> = ({ isOpen, onClose, result }) => {
	if (!isOpen || !result) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

			{/* Modal */}
			<div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
				<div className="p-6 flex-1 overflow-y-auto">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-gray-900">
							CSV Import {result.success ? 'Successful' : 'Failed'}
						</h3>
						<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					{/* Result Status */}
					<div
						className={`p-4 rounded-lg mb-4 ${
							result.success
								? 'bg-green-50 border border-green-200'
								: 'bg-red-50 border border-red-200'
						}`}
					>
						<div className="flex items-center gap-3">
							{result.success ? (
								<svg
									className="w-6 h-6 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							) : (
								<svg
									className="w-6 h-6 text-red-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							)}
							<div>
								<p
									className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}
								>
									{result.message}
								</p>
								{result.success && (
									<p className="text-sm text-green-700 mt-1">
										Successfully imported {result.imported} question
										{result.imported !== 1 ? 's' : ''}
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Warnings */}
					{result.warnings && result.warnings.length > 0 && (
						<div className="mb-4">
							<h4 className="font-medium text-yellow-900 mb-2">Warnings:</h4>
							<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
								<ul className="text-sm text-yellow-800 space-y-1">
									{result.warnings.map((warning, idx) => (
										<li key={idx} className="flex items-start gap-2">
											<span className="text-yellow-600 mt-0.5">⚠</span>
											<span>{warning}</span>
										</li>
									))}
								</ul>
							</div>
						</div>
					)}

					{/* Errors */}
					{result.errors && result.errors.length > 0 && (
						<div className="mb-4">
							<h4 className="font-medium text-red-900 mb-2">Errors:</h4>
							<div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto">
								<ul className="text-sm text-red-800 space-y-1">
									{result.errors.map((error, idx) => (
										<li key={idx} className="flex items-start gap-2">
											<span className="text-red-600 mt-0.5">✕</span>
											<span>{error}</span>
										</li>
									))}
								</ul>
							</div>
						</div>
					)}

					{/* Summary */}
					{result.success && (
						<div className="p-4 bg-gray-50 rounded-lg">
							<h4 className="font-medium text-gray-900 mb-2">Import Summary:</h4>
							<dl className="text-sm space-y-1">
								<div className="flex justify-between">
									<dt className="text-gray-600">Questions imported:</dt>
									<dd className="font-medium text-gray-900">{result.imported}</dd>
								</div>
								{result.warnings && (
									<div className="flex justify-between">
										<dt className="text-gray-600">Warnings:</dt>
										<dd className="font-medium text-yellow-600">
											{result.warnings.length}
										</dd>
									</div>
								)}
							</dl>
						</div>
					)}
				</div>

				{/* Actions */}
				<div className="p-6 border-t border-gray-200">
					<div className="flex justify-end">
						<button
							onClick={onClose}
							className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ImportResultModal;
