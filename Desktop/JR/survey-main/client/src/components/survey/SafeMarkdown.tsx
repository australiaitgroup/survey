import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface SafeMarkdownProps {
	content: string;
	className?: string;
}

const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content, className }) => {
	return (
		<div className={`prose max-w-none break-words ${className || ''}`}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[
					rehypeRaw,
					[
						rehypeSanitize as any,
						{
							tagNames: [
								'p',
								'br',
								'span',
								'strong',
								'em',
								'del',
								'code',
								'pre',
								'blockquote',
								'a',
								'h1',
								'h2',
								'h3',
								'h4',
								'h5',
								'h6',
								'ul',
								'ol',
								'li',
							],
							attributes: {
								a: ['href', 'title', 'rel', 'target'],
								code: ['className'],
								span: ['className'],
							},
						},
					],
				]}
				components={{
					img: ({ className: _cn, ...props }) => (
						// Ensure images in markdown are responsive
						<img
							className='max-w-full h-auto rounded-lg border border-gray-200'
							{...(props as any)}
						/>
					),
					a: ({ className: _c, ...props }) => (
						<a
							className='underline text-blue-600 break-words'
							target='_blank'
							rel='noopener noreferrer'
							{...(props as any)}
						/>
					),
					code: ({ className: _c, ...props }) => (
						<code className='break-all' {...(props as any)} />
					),
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
};

export default SafeMarkdown;
