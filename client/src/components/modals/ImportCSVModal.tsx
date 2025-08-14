import React, { useState } from 'react';
import api from '../../utils/axiosConfig';

interface ImportCSVModalProps {
	isOpen: boolean;
	onClose: () => void;
	onImport: (file: File) => Promise<void>;
	loading: boolean;
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ isOpen, onClose, onImport, loading }) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [dragActive, setDragActive] = useState(false);

	const handleFileSelect = (file: File | null) => {
		if (file && file.type === 'text/csv') {
			setSelectedFile(file);
		} else if (file) {
			alert('Please select a valid CSV file');
		}
	};

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true);
		} else if (e.type === 'dragleave') {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			handleFileSelect(e.dataTransfer.files[0]);
		}
	};

	const handleImport = async () => {
		if (!selectedFile) return;

		try {
			await onImport(selectedFile);
			setSelectedFile(null);
			onClose();
		} catch (error) {
			console.error('Import failed:', error);
		}
	};

	const handleClose = () => {
		setSelectedFile(null);
		onClose();
	};

	// 新增更兼容的下载模板方法
	const handleDownloadTemplate = async () => {
		try {
			const response = await api.get(`/admin/question-banks/csv-template/download?ts=${Date.now()}` , {
				responseType: 'blob',
			});
			const blob = response.data;
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'question_bank_template.csv';
			document.body.appendChild(a);
			a.click();
			setTimeout(() => {
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			}, 100);
		} catch {
			alert('下载失败，请稍后重试');
		}
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
			<div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
				<div className='flex justify-between items-center mb-4'>
					<h3 className='text-lg font-semibold text-gray-800'>导入 CSV 文件</h3>
					<button
						onClick={handleClose}
						className='text-gray-400 hover:text-gray-600 text-xl font-bold'
						disabled={loading}
					>
						×
					</button>
				</div>

				<div className='space-y-4'>
					{/* CSV Format Instructions */}
					<div className='bg-blue-50 p-3 rounded-lg text-sm'>
						<h4 className='font-medium text-blue-800 mb-2'>CSV 文件格式说明：</h4>
						<div className='text-blue-700 space-y-1'>
						<p>
							<strong>列名：</strong> questionText, description, type, options, correctAnswers,
							tags, explanation, points, difficulty, descriptionImage
						</p>
						<p>
							<strong>描述（description）：</strong> 可选，支持 Markdown 格式，用于题干的详细说明/场景描述。
						</p>
							<p>
								<strong>类型：</strong> single (单选), multiple (多选), text (文本)
							</p>
							<p>
								<strong>选项：</strong> 用分号(;)分隔
							</p>
							<p>
								<strong>正确答案：</strong> 选项索引，从0开始，多个用分号分隔
							</p>
							<p>
								<strong>标签：</strong> 用逗号(,)分隔，需要用双引号包围
							</p>
							<p>
								<strong>解释：</strong> 可选，答案解释
							</p>
							<p>
								<strong>分数：</strong> 可选，默认为1
							</p>
							<p>
								<strong>难度：</strong> easy, medium, hard (可选，默认medium)
							</p>
							<p>
								<strong>描述图片：</strong> 可选，图片URL
							</p>
						</div>
					</div>

					{/* Download Template Button */}
					<div className='text-center'>
						<button
							onClick={handleDownloadTemplate}
							className='btn-secondary text-sm'
							disabled={loading}
						>
							📄 下载 CSV 模板
						</button>
					</div>

					{/* File Upload Area */}
					<div
						className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
							dragActive
								? 'border-blue-400 bg-blue-50'
								: selectedFile
									? 'border-green-400 bg-green-50'
									: 'border-gray-300 hover:border-gray-400'
						}`}
						onDragEnter={handleDrag}
						onDragLeave={handleDrag}
						onDragOver={handleDrag}
						onDrop={handleDrop}
					>
						<input
							type='file'
							accept='.csv'
							onChange={e => handleFileSelect(e.target.files?.[0] || null)}
							className='hidden'
							id='csv-file-input'
							disabled={loading}
						/>

						{selectedFile ? (
							<div className='text-green-600'>
								<div className='text-2xl mb-2'>✓</div>
								<p className='font-medium'>{selectedFile.name}</p>
								<p className='text-sm text-gray-500'>
									大小: {(selectedFile.size / 1024).toFixed(1)} KB
								</p>
								<button
									onClick={() => setSelectedFile(null)}
									className='mt-2 text-sm text-red-600 hover:text-red-800'
									disabled={loading}
								>
									清除文件
								</button>
							</div>
						) : (
							<div className='text-gray-600'>
								<div className='text-3xl mb-2'>📁</div>
								<p className='font-medium mb-2'>拖拽 CSV 文件到这里</p>
								<p className='text-sm text-gray-500 mb-3'>或者</p>
								<label
									htmlFor='csv-file-input'
									className='btn-secondary cursor-pointer inline-block'
								>
									选择文件
								</label>
							</div>
						)}
					</div>

					{/* Action Buttons */}
					<div className='flex gap-2 pt-2'>
						<button
							onClick={handleImport}
							disabled={!selectedFile || loading}
							className='btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{loading ? '导入中...' : '开始导入'}
						</button>
						<button
							onClick={handleClose}
							disabled={loading}
							className='btn-secondary flex-1'
						>
							取消
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ImportCSVModal;
