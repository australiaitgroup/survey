import React, { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TurndownService from 'turndown';
import { marked } from 'marked';
import './TiptapEditor.css';

interface SimpleQuillEditorProps {
	value: string; // markdown string
	onChange: (value: string) => void; // callback with markdown string
	placeholder?: string;
	className?: string;
}

const SimpleQuillEditor: React.FC<SimpleQuillEditorProps> = ({
	value,
	onChange,
	placeholder = 'Enter description...',
	className = '',
}) => {
	const [isInitialized, setIsInitialized] = useState(false);

	const turndownService = useMemo(() => {
		const service = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
		service.addRule('strikethrough', {
			filter: ['del', 's', 'strike'],
			replacement: content => `~~${content}~~`,
		});
		return service;
	}, []);

	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
			Placeholder.configure({ placeholder }),
		],
		content: '',
		editorProps: {
			attributes: {
				class: 'min-h-[100px] focus:outline-none',
			},
		},
		onUpdate: ({ editor }) => {
			try {
				const html = editor.getHTML();
				const markdown = turndownService.turndown(html);
				onChange(markdown);
			} catch (error) {
				console.warn('Error converting HTML to markdown:', error);
				onChange(editor.getHTML());
			}
		},
	});

	// Initialize editor content from markdown once
	useEffect(() => {
		if (!editor) return;
		if (!isInitialized) {
			try {
				const html = value ? (marked(value) as string) : '';
				editor.commands.setContent(html || '', false);
			} catch (error) {
				console.warn('Error converting markdown to HTML:', error);
				editor.commands.clearContent();
			}
			setIsInitialized(true);
		}
	}, [editor, isInitialized, value]);

	if (!editor) return null;

	const applyLink = () => {
		const previousUrl = editor.getAttributes('link').href as string | undefined;
		const url = window.prompt('Enter URL', previousUrl || 'https://');
		if (url === null) return; // cancel
		if (url === '') {
			editor.chain().focus().unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	};

	return (
		<div className={`rounded-lg border border-gray-200 bg-white ${className}`}>
			{/* Toolbar */}
			<div className='flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1 rounded-t-lg'>
				<button
					type='button'
					className={`px-2 py-1 rounded ${editor.isActive('paragraph') ? 'bg-gray-200' : ''}`}
					onClick={() => editor.chain().focus().setParagraph().run()}
				>
					P
				</button>
				<button
					type='button'
					className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
					onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				>
					H1
				</button>
				<button
					type='button'
					className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				>
					H2
				</button>
				<button
					type='button'
					className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				>
					H3
				</button>

				<span className='mx-1 h-5 w-px bg-gray-300' />

				<button
					type='button'
					className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
					onClick={() => editor.chain().focus().toggleBold().run()}
				>
					B
				</button>
				<button
					type='button'
					className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				>
					I
				</button>
				<button
					type='button'
					className={`px-2 py-1 rounded ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
					onClick={() => editor.chain().focus().toggleUnderline().run()}
				>
					U
				</button>
				<button
					type='button'
					className={`px-2 py-1 rounded ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
					onClick={() => editor.chain().focus().toggleStrike().run()}
				>
					S
				</button>

				<span className='mx-1 h-5 w-px bg-gray-300' />

				<button
					type='button'
					className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				>
					• List
				</button>
				<button
					type='button'
					className={`px-2 py-1 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
				>
					1. List
				</button>
				<button
					type='button'
					className={`px-2 py-1 rounded ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
				>
					❝
				</button>
				<button
					type='button'
					className={`px-2 py-1 rounded ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
					onClick={() => editor.chain().focus().toggleCodeBlock().run()}
				>
					{'</>'}
				</button>

				<span className='mx-1 h-5 w-px bg-gray-300' />

				<button type='button' className='px-2 py-1 rounded' onClick={applyLink}>
					Link
				</button>
				<button
					type='button'
					className='px-2 py-1 rounded'
					onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
				>
					Clear
				</button>
			</div>

			<EditorContent
				editor={editor}
				className='rounded-b-lg px-3 py-2 prose prose-sm max-w-none tiptap-editor'
			/>
		</div>
	);
};

export default SimpleQuillEditor;
