import React from 'react';
import { useLocation } from 'react-router-dom';
import { initAnalytics, trackPageView } from './utils/analytics';

const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const location = useLocation();

	React.useEffect(() => {
		initAnalytics().catch(() => {});
	}, []);

	React.useEffect(() => {
		trackPageView(location.pathname + location.search);
	}, [location.pathname, location.search]);

	return <>{children}</>;
};

export default AnalyticsProvider;
