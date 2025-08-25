import { useEffect } from 'react';

export const useAggressiveAntiCheating = (enabled: boolean = true) => {
	useEffect(() => {
		if (!enabled) {
			console.log('❌ Anti-cheating disabled');
			return;
		}

		console.log('🛡️ AGGRESSIVE Anti-cheating enabled - running silently');

		// Multiple event handlers for maximum coverage - silent
		const preventEvent = (e: Event, message: string) => {
			console.log('🚫 Blocked event:', e.type, e);
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			return false;
		};

		// Keyboard event handler
		const handleKeyboard = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase();
			const code = e.code.toLowerCase();
			const isCtrl = e.ctrlKey || e.metaKey;

			console.log(`⌨️ Key: ${key}, Code: ${code}, Ctrl: ${isCtrl}, Shift: ${e.shiftKey}`);

			// Block various combinations
			if (
				(isCtrl && ['c', 'v', 'a', 'x', 'u', 's', 'p'].includes(key)) ||
				(isCtrl && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
				key === 'f12' ||
				code === 'f12' ||
				e.keyCode === 123 // F12 alternative
			) {
				return preventEvent(e, '⚠️ 该操作在测评中被禁用！');
			}
		};

		// Context menu handler
		const handleContextMenu = (e: MouseEvent) => {
			console.log('🖱️ Right click detected');
			return preventEvent(e, '⚠️ 右键菜单已被禁用！');
		};

		// Copy/paste handlers
		const handleCopy = (e: ClipboardEvent) => {
			console.log('📋 Copy attempt detected');
			return preventEvent(e, '⚠️ 复制功能已被禁用！');
		};

		const handlePaste = (e: ClipboardEvent) => {
			console.log('📋 Paste attempt detected');
			return preventEvent(e, '⚠️ 粘贴功能已被禁用！');
		};

		const handleCut = (e: ClipboardEvent) => {
			console.log('✂️ Cut attempt detected');
			return preventEvent(e, '⚠️ 剪切功能已被禁用！');
		};

		// Selection handlers - allow selection in input fields
		const handleSelectStart = (e: Event) => {
			const target = e.target as HTMLElement;
			// Allow selection in input fields and textareas
			if (target && target.tagName.match(/^(INPUT|TEXTAREA)$/)) {
				console.log('✅ Selection allowed in input field');
				return true;
			}
			console.log('🎯 Text selection blocked');
			e.preventDefault();
			return false;
		};

		const handleDragStart = (e: DragEvent) => {
			console.log('🔗 Drag attempt detected');
			return preventEvent(e, '⚠️ 拖拽功能已被禁用！');
		};

		// Add event listeners with multiple phases
		const events = [
			{ name: 'keydown', handler: handleKeyboard },
			{ name: 'keyup', handler: handleKeyboard },
			{ name: 'contextmenu', handler: handleContextMenu },
			{ name: 'copy', handler: handleCopy },
			{ name: 'paste', handler: handlePaste },
			{ name: 'cut', handler: handleCut },
			{ name: 'selectstart', handler: handleSelectStart },
			{ name: 'dragstart', handler: handleDragStart },
		];

		// Add listeners in both capture and bubble phases
		events.forEach(({ name, handler }) => {
			document.addEventListener(name, handler as (e: Event) => void, {
				capture: true,
				passive: false,
			});
			document.addEventListener(name, handler as (e: Event) => void, {
				capture: false,
				passive: false,
			});
			window.addEventListener(name, handler as (e: Event) => void, {
				capture: true,
				passive: false,
			});
		});

		// Disable text selection with multiple methods but allow input fields
		const disableSelection = () => {
			const nonInputStyles = {
				userSelect: 'none',
				webkitUserSelect: 'none',
				mozUserSelect: 'none',
				msUserSelect: 'none',
				webkitTouchCallout: 'none',
				webkitUserDrag: 'none',
			};

			// Apply selection blocking only to body, not all elements
			Object.assign(document.body.style, nonInputStyles);

			// Apply to non-interactive elements only
			const allElements = document.querySelectorAll('*');
			allElements.forEach(el => {
				if (el instanceof HTMLElement) {
					// Skip form elements and interactive elements
					if (!el.tagName.match(/^(INPUT|TEXTAREA|BUTTON|SELECT|A|LABEL)$/)) {
						Object.assign(el.style, nonInputStyles);
					}
				}
			});
		};

		disableSelection();

		// Block common debugging variables but keep console working
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).eval = undefined;

		// Cleanup function
		return () => {
			console.log('🧹 Cleaning up aggressive anti-cheating');

			// Remove all event listeners
			events.forEach(({ name, handler }) => {
				document.removeEventListener(name, handler as (e: Event) => void, { capture: true });
				document.removeEventListener(name, handler as (e: Event) => void, { capture: false });
				window.removeEventListener(name, handler as (e: Event) => void, { capture: true });
			});

			// Restore styles
			const restoreStyles = {
				userSelect: '',
				webkitUserSelect: '',
				mozUserSelect: '',
				msUserSelect: '',
				webkitTouchCallout: '',
				webkitUserDrag: '',
			};

			Object.assign(document.body.style, restoreStyles);

			const allElements = document.querySelectorAll('*');
			allElements.forEach(el => {
				if (el instanceof HTMLElement) {
					// Only restore styles for elements that had them applied
					if (!el.tagName.match(/^(INPUT|TEXTAREA|BUTTON|SELECT|A|LABEL)$/)) {
						Object.assign(el.style, restoreStyles);
					}
				}
			});

			// Restore eval only (console was never overridden)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(window as any).eval = eval;
		};
	}, [enabled]);
};
