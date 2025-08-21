// 获取应用的基础 URL
export const getBaseUrl = (): string => {
	// 优先使用环境变量
	if (import.meta.env.VITE_APP_URL) {
		return import.meta.env.VITE_APP_URL;
	}

	// 其次使用 window.location.origin
	if (typeof window !== 'undefined' && window.location.origin) {
		return window.location.origin;
	}

	// 最后使用默认值 (与 vite.config.ts 中的端口一致)
	return 'http://localhost:5051';
};

// 生成完整的 survey URL
export const getSurveyUrl = (slug: string): string => {
	return `${getBaseUrl()}/survey/${slug}`;
};
