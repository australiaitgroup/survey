import React from 'react';

type OpenGraph = {
	image?: string;
	url?: string;
};

type SEOProps = {
	title: string;
	description?: string;
	openGraph?: OpenGraph;
};

const SEO: React.FC<SEOProps> = ({ title, description, openGraph }) => {
	React.useEffect(() => {
		document.title = title;

		const ensureMeta = (selector: string, attr: 'content', value: string) => {
			let el = document.head.querySelector<HTMLMetaElement>(selector);
			if (!el) {
				el = document.createElement('meta');
				if (selector.startsWith('meta[name=')) {
					const name = selector.match(/meta\[name=['\"]([^'\"]+)/);
					if (name && name[1]) el.setAttribute('name', name[1]);
				} else if (selector.startsWith('meta[property=')) {
					const prop = selector.match(/meta\[property=['\"]([^'\"]+)/);
					if (prop && prop[1]) el.setAttribute('property', prop[1]);
				}
				document.head.appendChild(el);
			}
			el.setAttribute(attr, value);
		};

		if (description) {
			ensureMeta("meta[name='description']", 'content', description);
		}

		if (openGraph?.image) {
			ensureMeta("meta[property='og:image']", 'content', openGraph.image);
		}
		if (openGraph?.url) {
			ensureMeta("meta[property='og:url']", 'content', openGraph.url);
		}
		ensureMeta("meta[property='og:title']", 'content', title);
		if (description) ensureMeta("meta[property='og:description']", 'content', description);
		ensureMeta("meta[name='twitter:title']", 'content', title);
		if (description) ensureMeta("meta[name='twitter:description']", 'content', description);
	}, [title, description, openGraph?.image, openGraph?.url]);

	return null;
};

export default SEO;
