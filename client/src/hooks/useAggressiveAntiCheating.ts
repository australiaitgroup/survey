import { useEffect } from 'react';

export const useAggressiveAntiCheating = (enabled: boolean = true) => {
	useEffect(() => {
		if (!enabled) {
			console.log('❌ Anti-cheating disabled');
			return;
		}

		console.log('🛡️ AGGRESSIVE Anti-cheating enabled');

		// Show a warning message on page
		const warningDiv = document.createElement('div');
		warningDiv.id = 'anti-cheat-warning';
		warningDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #dc2626;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 9999;
      font-family: sans-serif;
    `;
		warningDiv.textContent = '🛡️ 防作弊模式已启用';
		document.body.appendChild(warningDiv);

		// Multiple event handlers for maximum coverage
		const preventEvent = (e: Event, message: string) => {
			console.log('🚫 Blocked event:', e.type, e);
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			alert(message);
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

		// Selection handlers
		const handleSelectStart = (e: Event) => {
			console.log('🎯 Text selection attempt');
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
			document.addEventListener(name, handler as EventListener, {
				capture: true,
				passive: false,
			});
			document.addEventListener(name, handler as EventListener, {
				capture: false,
				passive: false,
			});
			window.addEventListener(name, handler as EventListener, {
				capture: true,
				passive: false,
			});
		});

		// Disable text selection with multiple methods
		const disableSelection = () => {
			const styles = {
				userSelect: 'none',
				webkitUserSelect: 'none',
				mozUserSelect: 'none',
				msUserSelect: 'none',
				webkitTouchCallout: 'none',
				webkitUserDrag: 'none',
				pointerEvents: 'none',
			};

			Object.assign(document.body.style, styles);

			// Apply to all elements
			const allElements = document.querySelectorAll('*');
			allElements.forEach(el => {
				if (el instanceof HTMLElement) {
					Object.assign(el.style, styles);
					// Re-enable pointer events for interactive elements
					if (el.tagName.match(/^(INPUT|TEXTAREA|BUTTON|SELECT|A)$/)) {
						el.style.pointerEvents = 'auto';
					}
				}
			});
		};

		disableSelection();

		// Override console functions to prevent debugging
		const originalConsole = { ...console };
		Object.keys(console).forEach(key => {
			if (typeof console[key as keyof Console] === 'function') {
				(console as any)[key] = () => {};
			}
		});

		// Block common debugging variables
		(window as any).console = undefined;
		(window as any).eval = undefined;

		// Cleanup function
		return () => {
			console.log('🧹 Cleaning up aggressive anti-cheating');

			// Remove warning
			const warning = document.getElementById('anti-cheat-warning');
			if (warning) warning.remove();

			// Remove all event listeners
			events.forEach(({ name, handler }) => {
				document.removeEventListener(name, handler as EventListener, { capture: true });
				document.removeEventListener(name, handler as EventListener, { capture: false });
				window.removeEventListener(name, handler as EventListener, { capture: true });
			});

			// Restore styles
			const restoreStyles = {
				userSelect: '',
				webkitUserSelect: '',
				mozUserSelect: '',
				msUserSelect: '',
				webkitTouchCallout: '',
				webkitUserDrag: '',
				pointerEvents: '',
			};

			Object.assign(document.body.style, restoreStyles);

			const allElements = document.querySelectorAll('*');
			allElements.forEach(el => {
				if (el instanceof HTMLElement) {
					Object.assign(el.style, restoreStyles);
				}
			});

			// Restore console
			Object.assign(console, originalConsole);
			(window as any).console = originalConsole;
			(window as any).eval = eval;
		};
	}, [enabled]);
};
