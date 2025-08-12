import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
	className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
	const { i18n } = useTranslation();

	const handleLanguageChange = async (lang: string) => {
		try {
			await i18n.changeLanguage(lang);
			localStorage.setItem('i18nextLng', lang);
		} catch (error) {
			console.error('Error changing language:', error);
		}
	};

	const currentLabel = i18n.language === 'zh' ? '中文' : 'English';

	return (
		<div className={`relative ${className}`}>
			<details className='group inline-block'>
				<summary className='list-none cursor-pointer select-none px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 flex items-center gap-2'>
					<span className='inline-block w-4 h-4 rounded-sm bg-gray-200' />
					<span>{currentLabel}</span>
					<svg
						className='w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform'
						viewBox='0 0 20 20'
						fill='currentColor'
					>
						<path
							fillRule='evenodd'
							d='M5.23 7.21a.75.75 0 011.06.02L10 11.186l3.71-3.955a.75.75 0 111.08 1.04l-4.24 4.52a.75.75 0 01-1.08 0l-4.24-4.52a.75.75 0 01.02-1.06z'
							clipRule='evenodd'
						/>
					</svg>
				</summary>
				<div className='absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-md z-10'>
					<button
						onClick={() => handleLanguageChange('en')}
						className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${i18n.language === 'en' ? 'text-[#FF5A5F] font-semibold' : 'text-gray-700'}`}
					>
						English
					</button>
					<button
						onClick={() => handleLanguageChange('zh')}
						className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${i18n.language === 'zh' ? 'text-[#FF5A5F] font-semibold' : 'text-gray-700'}`}
					>
						中文
					</button>
				</div>
			</details>
		</div>
	);
};

export default LanguageSwitcher;
