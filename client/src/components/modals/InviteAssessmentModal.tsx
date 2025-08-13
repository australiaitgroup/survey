import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import api from '../../utils/axiosConfig';

interface InviteAssessmentModalProps {
	show: boolean;
	onClose: () => void;
	surveyId: string;
	surveyTitle: string;
}

const PAGE_SIZE = 10;

const InviteAssessmentModal: React.FC<InviteAssessmentModalProps> = ({
	show,
	onClose,
	surveyId,
	surveyTitle,
}) => {
	const [emails, setEmails] = useState('');
	const [expiresInDays, setExpiresInDays] = useState(7);
	const [sending, setSending] = useState(false);
	const [results, setResults] = useState<{ email: string; status: string; error?: string }[]>([]);
	const [error, setError] = useState('');

	// Invitation tracker state
	const [invitations, setInvitations] = useState<any[]>([]);
	const [loadingInvitations, setLoadingInvitations] = useState(false);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');

	// 加载邀请列表
	const loadInvitations = async () => {
		setLoadingInvitations(true);
		try {
			const res = await api.get(`/invitations/survey/${surveyId}`);
			setInvitations(res.data || []);
		} catch (err) {
			// ignore
		} finally {
			setLoadingInvitations(false);
		}
	};

	useEffect(() => {
		if (show) {
			loadInvitations();
		}
	}, [show, surveyId]);

	const handleSend = async () => {
		setSending(true);
		setError('');
		setResults([]);
		try {
			const emailList = emails
				.split(/[\,\n]/)
				.map(e => e.trim())
				.filter(e => e);
			if (emailList.length === 0) {
				setError('请输入至少一个有效邮箱');
				setSending(false);
				return;
			}
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + expiresInDays);
			const res = await api.post('/invitations', {
				surveyId,
				distributionMode: 'targeted',
				targetEmails: emailList,
				expiresAt: expiresAt.toISOString(),
			});
			setResults(res.data.results || []);
			setEmails('');
			loadInvitations(); // 发送后刷新列表
		} catch (err: unknown) {
			setError(err.response?.data?.error || err.message || '发送失败');
		} finally {
			setSending(false);
		}
	};

	const handleClose = () => {
		setEmails('');
		setResults([]);
		setError('');
		setSending(false);
		setPage(1);
		setSearch('');
		onClose();
	};

	// Get company information for generating tenant URLs
	const [companySlug, setCompanySlug] = useState<string>('');

	// Load company information
	useEffect(() => {
		const loadCompanyInfo = async () => {
			try {
				const res = await api.get('/companies/current');
				if (res.data.success && res.data.company?.slug) {
					setCompanySlug(res.data.company.slug);
				}
			} catch (err) {
				console.error('Failed to load company info:', err);
			}
		};

		if (show) {
			loadCompanyInfo();
		}
	}, [show]);

	// 复制链接
	const handleCopy = (token: string) => {
		const basePath = companySlug ? `/${companySlug}` : '';
		const url = `${window.location.origin}${basePath}/assessment/${token}`;
		navigator.clipboard.writeText(url);
	};

	// 过滤和分页
	const filtered = invitations.filter(
		inv =>
			!search ||
			(inv.targetEmails && inv.targetEmails.some((e: string) => e.includes(search)))
	);
	const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
	const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	// 状态判断
	const getStatus = (inv: unknown) => {
		const now = new Date();
		if (inv.completedBy && inv.completedBy.length > 0)
			return { label: '已完成', color: 'green' };
		if (inv.expiresAt && new Date(inv.expiresAt) < now)
			return { label: '已过期', color: 'red' };
		return { label: '未填写', color: 'gray' };
	};

	// token 显示
	const maskToken = (token: string) =>
		token ? token.slice(0, 6) + '****' + token.slice(-4) : '';

	return (
		<Modal show={show} title='📧 邀请用户测评' onClose={handleClose}>
			<div className='space-y-4'>
				<div>
					<div className='mb-1 text-gray-700 font-medium'>测评名称：</div>
					<div className='mb-2 text-blue-700 font-semibold'>{surveyTitle}</div>
				</div>
				<div>
					<label className='block mb-1 text-gray-700'>
						用户邮箱（可批量，逗号或换行分隔）
					</label>
					<textarea
						className='w-full border rounded p-2 min-h-[80px]'
						value={emails}
						onChange={e => setEmails(e.target.value)}
						placeholder='user1@example.com, user2@example.com\nuser3@example.com'
						disabled={sending}
					/>
				</div>
				<div>
					<label className='block mb-1 text-gray-700'>链接有效天数</label>
					<input
						type='number'
						min={1}
						max={30}
						className='w-24 border rounded p-1'
						value={expiresInDays}
						onChange={e => setExpiresInDays(Number(e.target.value))}
						disabled={sending}
					/>
					<span className='ml-2 text-gray-500 text-sm'>（默认 7 天）</span>
				</div>
				<button
					className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded mt-2 disabled:opacity-60'
					onClick={handleSend}
					disabled={sending}
				>
					{sending ? '发送中...' : '发送邀请'}
				</button>
				{error && <div className='text-red-600 text-sm mt-2'>{error}</div>}
				{results.length > 0 && (
					<div className='mt-4'>
						<div className='font-medium mb-2'>发送结果：</div>
						<ul className='space-y-1 max-h-40 overflow-y-auto'>
							{results.map(r => (
								<li
									key={r.email}
									className={
										r.status === 'success' ? 'text-green-600' : 'text-red-600'
									}
								>
									{r.email} -{' '}
									{r.status === 'success' ? '成功' : `失败: ${r.error}`}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* 已邀请用户列表 */}
				<div className='mt-8'>
					<div className='flex justify-between items-center mb-2'>
						<div className='font-medium text-gray-800'>已邀请用户列表</div>
						<input
							className='border rounded px-2 py-1 text-sm'
							placeholder='搜索邮箱'
							value={search}
							onChange={e => {
								setSearch(e.target.value);
								setPage(1);
							}}
							style={{ width: 180 }}
						/>
					</div>
					<div className='overflow-x-auto'>
						<table className='min-w-full text-sm border'>
							<thead>
								<tr className='bg-gray-100'>
									<th className='px-2 py-1 border'>Email</th>
									<th className='px-2 py-1 border'>Token</th>
									<th className='px-2 py-1 border'>邀请时间</th>
									<th className='px-2 py-1 border'>有效期</th>
									<th className='px-2 py-1 border'>状态</th>
									<th className='px-2 py-1 border'>操作</th>
								</tr>
							</thead>
							<tbody>
								{loadingInvitations ? (
									<tr>
										<td colSpan={6} className='text-center py-4'>
											加载中...
										</td>
									</tr>
								) : paged.length === 0 ? (
									<tr>
										<td colSpan={6} className='text-center py-4'>
											暂无邀请
										</td>
									</tr>
								) : (
									paged.map(inv => {
										const status = getStatus(inv);
										return (
											<tr key={inv._id}>
												<td className='px-2 py-1 border'>
													{inv.targetEmails?.[0]}
												</td>
												<td className='px-2 py-1 border font-mono'>
													{maskToken(inv.invitationCode)}
												</td>
												<td className='px-2 py-1 border'>
													{inv.createdAt
														? new Date(inv.createdAt).toLocaleString('en-US', { 
															timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, 
															timeZoneName: 'short' 
														})
														: ''}
												</td>
												<td className='px-2 py-1 border'>
													{inv.expiresAt
														? new Date(
															inv.expiresAt
														).toLocaleDateString()
														: '永久'}
												</td>
												<td className='px-2 py-1 border'>
													<span
														className={`px-2 py-1 rounded text-xs font-bold bg-${status.color}-100 text-${status.color}-700`}
													>
														{status.label}
													</span>
												</td>
												<td className='px-2 py-1 border space-x-2'>
													<button
														className='text-blue-600 hover:underline'
														onClick={() =>
															handleCopy(inv.invitationCode)
														}
													>
														复制链接
													</button>
													{/* 可扩展：重新发送/删除邀请 */}
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
					{/* 分页 */}
					{totalPages > 1 && (
						<div className='flex justify-center items-center gap-2 mt-2'>
							<button
								disabled={page === 1}
								onClick={() => setPage(page - 1)}
								className='px-2 py-1 border rounded disabled:opacity-50'
							>
								上一页
							</button>
							<span>
								第 {page} / {totalPages} 页
							</span>
							<button
								disabled={page === totalPages}
								onClick={() => setPage(page + 1)}
								className='px-2 py-1 border rounded disabled:opacity-50'
							>
								下一页
							</button>
						</div>
					)}
				</div>
			</div>
		</Modal>
	);
};

export default InviteAssessmentModal;
