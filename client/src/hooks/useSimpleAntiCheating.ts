import { useEffect } from 'react';

export const useSimpleAntiCheating = (enabled: boolean = true) => {
	useEffect(() => {
		if (!enabled) {
			console.log('Anti-cheating disabled');
			return;
		}

		console.log('Anti-cheating enabled - setting up event listeners');

		const handleKeyDown = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase();
			const isCtrl = e.ctrlKey || e.metaKey;

			console.log(`Key pressed: ${key}, Ctrl: ${isCtrl}, Shift: ${e.shiftKey}`);

			// Block Ctrl+C (Copy) - silent
			if (isCtrl && key === 'c') {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}

			// Block Ctrl+V (Paste) - silent
			if (isCtrl && key === 'v') {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}

			// Block Ctrl+A (Select All) - silent
			if (isCtrl && key === 'a') {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}

			// Block Ctrl+X (Cut) - silent
			if (isCtrl && key === 'x') {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}

			// Block F12 - silent
			if (key === 'f12') {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}

			// Block Ctrl+Shift+I - silent
			if (isCtrl && e.shiftKey && key === 'i') {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}

			// Block Ctrl+U - silent
			if (isCtrl && key === 'u') {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		};

		const handleContextMenu = (e: MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			return false;
		};

		const handleCopy = (e: ClipboardEvent) => {
			e.preventDefault();
			e.stopPropagation();
			return false;
		};

		const handlePaste = (e: ClipboardEvent) => {
			e.preventDefault();
			e.stopPropagation();
			return false;
		};

		const handleSelectStart = (e: Event) => {
			const target = e.target as HTMLElement;
			// Allow selection in input fields and textareas
			if (target && target.tagName.match(/^(INPUT|TEXTAREA)$/)) {
				return true;
			}
			e.preventDefault();
			return false;
		};

		// Add all event listeners
		document.addEventListener('keydown', handleKeyDown, true);
		document.addEventListener('contextmenu', handleContextMenu, true);
		document.addEventListener('copy', handleCopy, true);
		document.addEventListener('paste', handlePaste, true);
		document.addEventListener('selectstart', handleSelectStart, true);

		// Disable text selection via CSS
		document.body.style.userSelect = 'none';
		document.body.style.webkitUserSelect = 'none';
		document.body.style.mozUserSelect = 'none';
		document.body.style.msUserSelect = 'none';

		// Cleanup
		return () => {
			console.log('Cleaning up anti-cheating event listeners');
			document.removeEventListener('keydown', handleKeyDown, true);
			document.removeEventListener('contextmenu', handleContextMenu, true);
			document.removeEventListener('copy', handleCopy, true);
			document.removeEventListener('paste', handlePaste, true);
			document.removeEventListener('selectstart', handleSelectStart, true);

			// Restore text selection
			document.body.style.userSelect = '';
			document.body.style.webkitUserSelect = '';
			document.body.style.mozUserSelect = '';
			document.body.style.msUserSelect = '';
		};
	}, [enabled]);
};
