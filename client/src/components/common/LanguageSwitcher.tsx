import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface LanguageSwitcherProps {
	className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
	const { i18n } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const handleLanguageChange = async (lang: string) => {
		try {
			await i18n.changeLanguage(lang);
			localStorage.setItem('i18nextLng', lang);
			setIsOpen(false);
		} catch (error) {
			console.error('Error changing language:', error);
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	const currentLabel = i18n.language === 'zh' ? '中文' : 'English';

	return (
		<div className={`relative ${className}`} ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className='flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-[#FF5A5F] transition-colors duration-200 cursor-pointer'
			>
				<LanguageIcon className='w-5 h-5' />
				<ChevronDownIcon className={`w-4 h-4 transition-transform ${
					isOpen ? 'rotate-180' : ''
				}`} />
			</button>
			{isOpen && (
				<div className='absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10'>
					<button
						onClick={() => handleLanguageChange('en')}
						className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 ${
							i18n.language === 'en' ? 'text-[#FF5A5F] font-semibold' : 'text-gray-700'
						}`}
					>
						English
					</button>
					<button
						onClick={() => handleLanguageChange('zh')}
						className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 ${
							i18n.language === 'zh' ? 'text-[#FF5A5F] font-semibold' : 'text-gray-700'
						}`}
					>
						中文
					</button>
				</div>
			)}
		</div>
	);
};

export default LanguageSwitcher;
