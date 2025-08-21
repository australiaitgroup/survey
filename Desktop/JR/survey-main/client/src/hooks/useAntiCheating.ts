import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface AntiCheatingOptions {
	enabled?: boolean;
	disableCopy?: boolean;
	disablePaste?: boolean;
	disableRightClick?: boolean;
	disableSelectAll?: boolean;
	disableDevTools?: boolean;
	showWarnings?: boolean;
}

export const useAntiCheating = (options: AntiCheatingOptions = {}) => {
	const { t } = useTranslation();

	const {
		enabled = true,
		disableCopy = true,
		disablePaste = true,
		disableRightClick = true,
		disableSelectAll = true,
		disableDevTools = true,
		showWarnings = true,
	} = options;

	const showWarning = useCallback(
		(message: string) => {
			if (showWarnings) {
				alert(message);
			}
		},
		[showWarnings]
	);

	const preventCopy = useCallback(
		(e: React.ClipboardEvent) => {
			e.preventDefault();
			showWarning(t('survey.antiCheat.copyDisabled'));
		},
		[showWarning, t]
	);

	const preventPaste = useCallback(
		(e: React.ClipboardEvent) => {
			e.preventDefault();
			showWarning(t('survey.antiCheat.pasteDisabled'));
		},
		[showWarning, t]
	);

	const preventKeyboardShortcuts = useCallback(
		(e: KeyboardEvent) => {
			if (!enabled) return;

			// Debug logging
			console.log(
				'Key pressed:',
				e.key,
				'Ctrl:',
				e.ctrlKey,
				'Meta:',
				e.metaKey,
				'Shift:',
				e.shiftKey
			);

			// Prevent copy shortcuts (Ctrl+C, Ctrl+X)
			if (disableCopy && (e.ctrlKey || e.metaKey)) {
				if (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'x') {
					e.preventDefault();
					e.stopPropagation();
					showWarning(
						t(
							'survey.antiCheat.copyWarning',
							'For fair assessment, copying content is not allowed.'
						)
					);
					return false;
				}
			}

			// Prevent paste shortcuts (Ctrl+V)
			if (disablePaste && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
				e.preventDefault();
				e.stopPropagation();
				showWarning(
					t(
						'survey.antiCheat.pasteWarning',
						'For fair assessment, pasting content is not allowed.'
					)
				);
				return false;
			}

			// Prevent select all (Ctrl+A)
			if (disableSelectAll && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
				e.preventDefault();
				e.stopPropagation();
				showWarning(
					t(
						'survey.antiCheat.selectAllWarning',
						'Select all is disabled during assessment.'
					)
				);
				return false;
			}

			// Prevent dev tools shortcuts
			if (disableDevTools) {
				if (
					e.key === 'F12' ||
					((e.ctrlKey || e.metaKey) &&
						e.shiftKey &&
						(e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'j')) ||
					((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u')
				) {
					e.preventDefault();
					e.stopPropagation();
					showWarning(
						t(
							'survey.antiCheat.devToolsWarning',
							'Developer tools are disabled during assessment.'
						)
					);
					return false;
				}
			}
		},
		[enabled, disableCopy, disablePaste, disableSelectAll, disableDevTools, showWarning, t]
	);

	useEffect(() => {
		if (!enabled) return;

		console.log('Anti-cheating enabled:', enabled);

		// Add event listeners with capture phase to ensure they're triggered first
		const keydownHandler = (e: KeyboardEvent) => {
			preventKeyboardShortcuts(e);
		};

		const copyHandler = (e: ClipboardEvent) => {
			e.preventDefault();
			e.stopPropagation();
			showWarning(
				t(
					'survey.antiCheat.copyWarning',
					'For fair assessment, copying content is not allowed.'
				)
			);
			return false;
		};

		const pasteHandler = (e: ClipboardEvent) => {
			e.preventDefault();
			e.stopPropagation();
			showWarning(
				t(
					'survey.antiCheat.pasteWarning',
					'For fair assessment, pasting content is not allowed.'
				)
			);
			return false;
		};

		const contextMenuHandler = (e: MouseEvent) => {
			if (!enabled || !disableRightClick) return;

			e.preventDefault();
			e.stopPropagation();
			showWarning(
				t(
					'survey.antiCheat.rightClickWarning',
					'Right-click is disabled during assessment.'
				)
			);
			return false;
		};

		const selectStartHandler = (e: Event) => {
			e.preventDefault();
			return false;
		};

		// Add event listeners with capture=true to intercept events early
		document.addEventListener('keydown', keydownHandler, { capture: true, passive: false });

		if (disableCopy) {
			document.addEventListener('copy', copyHandler, { capture: true, passive: false });
			document.addEventListener('cut', copyHandler, { capture: true, passive: false });
			document.addEventListener('selectstart', selectStartHandler, {
				capture: true,
				passive: false,
			});
		}

		if (disablePaste) {
			document.addEventListener('paste', pasteHandler, { capture: true, passive: false });
		}

		if (disableRightClick) {
			document.addEventListener('contextmenu', contextMenuHandler, {
				capture: true,
				passive: false,
			});
		}

		// Prevent text selection with CSS
		if (disableCopy) {
			document.body.style.userSelect = 'none';
			document.body.style.webkitUserSelect = 'none';
			document.body.style.mozUserSelect = 'none';
			document.body.style.msUserSelect = 'none';
		}

		// Cleanup function
		return () => {
			document.removeEventListener('keydown', keydownHandler, { capture: true });
			document.removeEventListener('copy', copyHandler, { capture: true });
			document.removeEventListener('cut', copyHandler, { capture: true });
			document.removeEventListener('paste', pasteHandler, { capture: true });
			document.removeEventListener('contextmenu', contextMenuHandler, { capture: true });
			document.removeEventListener('selectstart', selectStartHandler, { capture: true });

			// Restore text selection
			document.body.style.userSelect = '';
			document.body.style.webkitUserSelect = '';
			document.body.style.mozUserSelect = '';
			document.body.style.msUserSelect = '';
		};
	}, [
		enabled,
		disableCopy,
		disablePaste,
		disableRightClick,
		preventKeyboardShortcuts,
		showWarning,
		t,
	]);

	const getInputProps = () => ({
		onPaste: disablePaste
			? (preventPaste as unknown as React.ClipboardEventHandler<
					HTMLInputElement & HTMLTextAreaElement
				>)
			: undefined,
		onCopy: disableCopy
			? (preventCopy as unknown as React.ClipboardEventHandler<
					HTMLInputElement & HTMLTextAreaElement
				>)
			: undefined,
		onCut: disableCopy
			? (preventCopy as unknown as React.ClipboardEventHandler<
					HTMLInputElement & HTMLTextAreaElement
				>)
			: undefined,
	});

	return { getInputProps } as const;
};
