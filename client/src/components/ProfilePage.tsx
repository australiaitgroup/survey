import React, { useState } from 'react';
import ProfileBilling from './ProfileBilling';
import useSubscription from '../hooks/useSubscription';

interface TabItem {
	id: string;
	name: string;
	icon: React.ReactNode;
	component: React.ReactNode;
}

const ProfilePage: React.FC = () => {
	const { hasActiveSubscription, subscriptionInfo } = useSubscription();

	// Get tab from URL params for direct navigation
	const urlParams = new URLSearchParams(window.location.search);
	const tabFromUrl = urlParams.get('tab');
	const [activeTab, setActiveTab] = useState(tabFromUrl || 'profile');

	// Mock user data - replace with actual user context/hook
	const user = {
		name: '张三',
		email: 'zhangsan@example.com',
		role: 'user',
		company: '示例公司',
		avatar: null,
		createdAt: '2024-01-15',
	};

	const tabs: TabItem[] = [
		{
			id: 'profile',
			name: '个人信息',
			icon: (
				<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={2}
						d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
					/>
				</svg>
			),
			component: <ProfileInfo user={user} />,
		},
		{
			id: 'account',
			name: '账户设置',
			icon: (
				<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={2}
						d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
					/>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={2}
						d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
					/>
				</svg>
			),
			component: <AccountSettings user={user} />,
		},
		{
			id: 'billing',
			name: '订阅管理',
			icon: (
				<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={2}
						d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
					/>
				</svg>
			),
			component: <ProfileBilling />,
		},
	];

	const getTabIndicator = (tabId: string) => {
		if (tabId === 'billing') {
			if (hasActiveSubscription) {
				return (
					<span className='ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
						{subscriptionInfo?.subscriptionTier?.toUpperCase()}
					</span>
				);
			} else {
				return (
					<span className='ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
						未订阅
					</span>
				);
			}
		}
		return null;
	};

	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
				{/* Header */}
				<div className='mb-8'>
					<h1 className='text-3xl font-bold text-gray-900'>个人中心</h1>
					<p className='mt-1 text-sm text-gray-600'>
						管理您的个人信息、账户设置和订阅服务
					</p>
				</div>

				{/* Tabs */}
				<div className='bg-white rounded-lg shadow'>
					<div className='border-b border-gray-200'>
						<nav className='-mb-px flex space-x-8 px-6' aria-label='Tabs'>
							{tabs.map(tab => (
								<button
									key={tab.id}
									onClick={() => {
										setActiveTab(tab.id);
										// Update URL to reflect current tab
										const newUrl = new URL(window.location.href);
										if (tab.id === 'profile') {
											newUrl.searchParams.delete('tab');
										} else {
											newUrl.searchParams.set('tab', tab.id);
										}
										window.history.pushState({}, '', newUrl.toString());
									}}
									className={`${
										activeTab === tab.id
											? 'border-blue-500 text-blue-600'
											: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
									} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
								>
									{tab.icon}
									<span className='ml-2'>{tab.name}</span>
									{getTabIndicator(tab.id)}
								</button>
							))}
						</nav>
					</div>

					{/* Tab Content */}
					<div className='p-6'>{tabs.find(tab => tab.id === activeTab)?.component}</div>
				</div>
			</div>
		</div>
	);
};

// Profile Info Component
const ProfileInfo: React.FC<{ user: any }> = ({ user }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({
		name: user.name,
		email: user.email,
		company: user.company,
	});

	const handleSave = () => {
		// TODO: Implement save functionality
		console.log('Saving profile data:', formData);
		setIsEditing(false);
	};

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h2 className='text-lg font-medium text-gray-900'>个人信息</h2>
				<button
					onClick={() => setIsEditing(!isEditing)}
					className='text-blue-600 hover:text-blue-500 text-sm font-medium'
				>
					{isEditing ? '取消' : '编辑'}
				</button>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				{/* Avatar */}
				<div className='flex flex-col items-center'>
					<div className='w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center'>
						{user.avatar ? (
							<img
								src={user.avatar}
								alt='Avatar'
								className='w-24 h-24 rounded-full object-cover'
							/>
						) : (
							<svg
								className='w-12 h-12 text-gray-400'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
								/>
							</svg>
						)}
					</div>
					{isEditing && (
						<button className='mt-2 text-sm text-blue-600 hover:text-blue-500'>
							更换头像
						</button>
					)}
				</div>

				{/* Form */}
				<div className='md:col-span-2 space-y-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>姓名</label>
						{isEditing ? (
							<input
								type='text'
								value={formData.name}
								onChange={e => setFormData({ ...formData, name: e.target.value })}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						) : (
							<p className='text-gray-900'>{user.name}</p>
						)}
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>邮箱</label>
						{isEditing ? (
							<input
								type='email'
								value={formData.email}
								onChange={e => setFormData({ ...formData, email: e.target.value })}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						) : (
							<p className='text-gray-900'>{user.email}</p>
						)}
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>公司</label>
						{isEditing ? (
							<input
								type='text'
								value={formData.company}
								onChange={e =>
									setFormData({ ...formData, company: e.target.value })
								}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						) : (
							<p className='text-gray-900'>{user.company}</p>
						)}
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>角色</label>
						<p className='text-gray-900 capitalize'>{user.role}</p>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>
							注册时间
						</label>
						<p className='text-gray-900'>
							{new Date(user.createdAt).toLocaleDateString('zh-CN')}
						</p>
					</div>

					{isEditing && (
						<div className='flex space-x-3 pt-4'>
							<button
								onClick={handleSave}
								className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium'
							>
								保存
							</button>
							<button
								onClick={() => setIsEditing(false)}
								className='bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium'
							>
								取消
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

// Account Settings Component
const AccountSettings: React.FC<{ user: any }> = ({ user }) => {
	const [passwordData, setPasswordData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	const handlePasswordChange = () => {
		// TODO: Implement password change functionality
		console.log('Changing password');
	};

	return (
		<div className='space-y-8'>
			<div>
				<h2 className='text-lg font-medium text-gray-900 mb-4'>账户设置</h2>
			</div>

			{/* Password Change */}
			<div className='bg-gray-50 rounded-lg p-6'>
				<h3 className='text-md font-medium text-gray-900 mb-4'>修改密码</h3>
				<div className='space-y-4 max-w-md'>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>
							当前密码
						</label>
						<input
							type='password'
							value={passwordData.currentPassword}
							onChange={e =>
								setPasswordData({
									...passwordData,
									currentPassword: e.target.value,
								})
							}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>
							新密码
						</label>
						<input
							type='password'
							value={passwordData.newPassword}
							onChange={e =>
								setPasswordData({ ...passwordData, newPassword: e.target.value })
							}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>
							确认新密码
						</label>
						<input
							type='password'
							value={passwordData.confirmPassword}
							onChange={e =>
								setPasswordData({
									...passwordData,
									confirmPassword: e.target.value,
								})
							}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>
					<button
						onClick={handlePasswordChange}
						className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium'
					>
						更新密码
					</button>
				</div>
			</div>

			{/* Notification Settings */}
			<div className='bg-gray-50 rounded-lg p-6'>
				<h3 className='text-md font-medium text-gray-900 mb-4'>通知设置</h3>
				<div className='space-y-4'>
					<div className='flex items-center justify-between'>
						<div>
							<h4 className='text-sm font-medium text-gray-900'>邮件通知</h4>
							<p className='text-sm text-gray-600'>接收重要的账户和订阅更新</p>
						</div>
						<input
							type='checkbox'
							defaultChecked
							className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
						/>
					</div>
					<div className='flex items-center justify-between'>
						<div>
							<h4 className='text-sm font-medium text-gray-900'>调查通知</h4>
							<p className='text-sm text-gray-600'>当有新的调查邀请时通知我</p>
						</div>
						<input
							type='checkbox'
							defaultChecked
							className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
						/>
					</div>
					<div className='flex items-center justify-between'>
						<div>
							<h4 className='text-sm font-medium text-gray-900'>营销邮件</h4>
							<p className='text-sm text-gray-600'>接收产品更新和营销信息</p>
						</div>
						<input
							type='checkbox'
							className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
						/>
					</div>
				</div>
			</div>

			{/* Danger Zone */}
			<div className='bg-red-50 border border-red-200 rounded-lg p-6'>
				<h3 className='text-md font-medium text-red-900 mb-4'>危险操作</h3>
				<div className='space-y-4'>
					<div>
						<h4 className='text-sm font-medium text-red-900'>删除账户</h4>
						<p className='text-sm text-red-700 mb-3'>
							删除您的账户将永久删除所有数据，包括调查、回复和设置。此操作无法撤销。
						</p>
						<button className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm'>
							删除账户
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProfilePage;
