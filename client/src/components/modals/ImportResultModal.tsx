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
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
			<div className='bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto'>
				<div className='flex justify-between items-center mb-4'>
					<h3 className='text-lg font-semibold text-gray-800'>导入结果</h3>
					<button
						onClick={onClose}
						className='text-gray-400 hover:text-gray-600 text-xl font-bold'
					>
						×
					</button>
				</div>

				<div className='space-y-4'>
					{/* Success/Error Status */}
					<div
						className={`p-4 rounded-lg ${
							result.success
								? 'bg-green-50 border border-green-200'
								: 'bg-red-50 border border-red-200'
						}`}
					>
						<div className='flex items-center gap-2 mb-2'>
							<div
								className={`text-2xl ${result.success ? 'text-green-600' : 'text-red-600'}`}
							>
								{result.success ? '✅' : '❌'}
							</div>
							<h4
								className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}
							>
								{result.success ? '导入成功' : '导入失败'}
							</h4>
						</div>
						<p className={result.success ? 'text-green-700' : 'text-red-700'}>
							{result.message}
						</p>
						{result.success && (
							<p className='text-green-600 font-medium mt-2'>
								成功导入 {result.imported} 道题目
							</p>
						)}
					</div>

					{/* Warnings */}
					{result.warnings && result.warnings.length > 0 && (
						<div className='bg-yellow-50 border border-yellow-200 p-4 rounded-lg'>
							<h4 className='font-semibold text-yellow-800 mb-2 flex items-center gap-2'>
								⚠️ 警告信息
							</h4>
							<div className='text-yellow-700 space-y-1 text-sm max-h-40 overflow-y-auto'>
								{result.warnings.map((warning, index) => (
									<div key={index} className='flex items-start gap-2'>
										<span className='text-yellow-600 mt-0.5'>•</span>
										<span>{warning}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Errors */}
					{result.errors && result.errors.length > 0 && (
						<div className='bg-red-50 border border-red-200 p-4 rounded-lg'>
							<h4 className='font-semibold text-red-800 mb-2 flex items-center gap-2'>
								❌ 错误信息
							</h4>
							<div className='text-red-700 space-y-1 text-sm max-h-40 overflow-y-auto'>
								{result.errors.map((error, index) => (
									<div key={index} className='flex items-start gap-2'>
										<span className='text-red-600 mt-0.5'>•</span>
										<span>{error}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Tips */}
					{result.success && (result.warnings?.length || 0) > 0 && (
						<div className='bg-blue-50 border border-blue-200 p-4 rounded-lg'>
							<h4 className='font-semibold text-blue-800 mb-2'>💡 提示</h4>
							<div className='text-blue-700 text-sm space-y-1'>
								<p>• 有部分行存在问题但已跳过，请检查警告信息</p>
								<p>• 建议修正 CSV 文件后重新导入跳过的题目</p>
								<p>• 可以下载模板文件参考正确格式</p>
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className='flex gap-2 pt-2'>
						<button onClick={onClose} className='btn-primary flex-1'>
							确定
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ImportResultModal;
