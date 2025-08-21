import { useEffect } from 'react';

export const useWorkingAntiCheating = (enabled: boolean = true) => {
	useEffect(() => {
		if (!enabled) {
			console.log('Anti-cheating disabled');
			return;
		}

		console.log('🚀 Working Anti-cheating enabled');

		// Show status indicator
		const statusDiv = document.createElement('div');
		statusDiv.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: #16a34a;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      z-index: 10000;
      font-family: monospace;
    `;
		statusDiv.textContent = '🛡️ Anti-Cheat Active';
		document.body.appendChild(statusDiv);

		// Comprehensive event blocking
		const blockEvent = (e: Event, message: string) => {
			console.log(`🚫 Blocked: ${e.type}`);
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();

			// Show alert
			setTimeout(() => alert(message), 10);
			return false;
		};

		// Keyboard event handler - very specific
		const keyHandler = (e: KeyboardEvent) => {
			const ctrl = e.ctrlKey || e.metaKey;
			const shift = e.shiftKey;
			const key = e.key?.toLowerCase() || '';
			const code = e.code?.toLowerCase() || '';

			console.log(`Key: ${key}/${code}, Ctrl: ${ctrl}, Shift: ${shift}`);

			// Block specific combinations
			if (ctrl && key === 'c') return blockEvent(e, '禁止复制！');
			if (ctrl && key === 'v') return blockEvent(e, '禁止粘贴！');
			if (ctrl && key === 'x') return blockEvent(e, '禁止剪切！');
			if (ctrl && key === 'a') return blockEvent(e, '禁止全选！');
			if (ctrl && key === 'u') return blockEvent(e, '禁止查看源码！');
			if (ctrl && shift && key === 'i') return blockEvent(e, '禁止开发者工具！');
			if (ctrl && shift && key === 'j') return blockEvent(e, '禁止控制台！');
			if (key === 'f12' || code === 'f12') return blockEvent(e, '禁止F12！');
		};

		// Right-click handler
		const contextHandler = (e: MouseEvent) => {
			console.log('🖱️ Right click blocked');
			return blockEvent(e, '禁止右键！');
		};

		// Clipboard handlers
		const clipboardHandler = (e: ClipboardEvent) => {
			console.log(`📋 Clipboard ${e.type} blocked`);
			return blockEvent(e, `禁止${e.type}操作！`);
		};

		// Selection handler
		const selectHandler = (e: Event) => {
			console.log('📝 Selection blocked');
			e.preventDefault();
			return false;
		};

		// Register all event listeners with highest priority
		const eventOptions = { capture: true, passive: false };

		// Keyboard events
		document.addEventListener('keydown', keyHandler, eventOptions);
		document.addEventListener('keyup', keyHandler, eventOptions);
		window.addEventListener('keydown', keyHandler, eventOptions);

		// Mouse events
		document.addEventListener('contextmenu', contextHandler, eventOptions);
		window.addEventListener('contextmenu', contextHandler, eventOptions);

		// Clipboard events
		document.addEventListener('copy', clipboardHandler, eventOptions);
		document.addEventListener('cut', clipboardHandler, eventOptions);
		document.addEventListener('paste', clipboardHandler, eventOptions);
		window.addEventListener('copy', clipboardHandler, eventOptions);
		window.addEventListener('cut', clipboardHandler, eventOptions);
		window.addEventListener('paste', clipboardHandler, eventOptions);

		// Selection events
		document.addEventListener('selectstart', selectHandler, eventOptions);
		document.addEventListener('mousedown', selectHandler, eventOptions);

		// CSS-based protection
		const originalStyles = {
			userSelect: document.body.style.userSelect,
			webkitUserSelect: document.body.style.webkitUserSelect,
			mozUserSelect: document.body.style.mozUserSelect,
			msUserSelect: document.body.style.msUserSelect,
		};

		document.body.style.userSelect = 'none';
		document.body.style.webkitUserSelect = 'none';
		document.body.style.mozUserSelect = 'none';
		document.body.style.msUserSelect = 'none';

		// Add CSS rules dynamically
		const style = document.createElement('style');
		style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
		document.head.appendChild(style);

		console.log('✅ All anti-cheat protections active');

		// Cleanup
		return () => {
			console.log('🧹 Removing anti-cheat protections');

			// Remove status indicator
			statusDiv.remove();

			// Remove event listeners
			document.removeEventListener('keydown', keyHandler, eventOptions);
			document.removeEventListener('keyup', keyHandler, eventOptions);
			window.removeEventListener('keydown', keyHandler, eventOptions);

			document.removeEventListener('contextmenu', contextHandler, eventOptions);
			window.removeEventListener('contextmenu', contextHandler, eventOptions);

			document.removeEventListener('copy', clipboardHandler, eventOptions);
			document.removeEventListener('cut', clipboardHandler, eventOptions);
			document.removeEventListener('paste', clipboardHandler, eventOptions);
			window.removeEventListener('copy', clipboardHandler, eventOptions);
			window.removeEventListener('cut', clipboardHandler, eventOptions);
			window.removeEventListener('paste', clipboardHandler, eventOptions);

			document.removeEventListener('selectstart', selectHandler, eventOptions);
			document.removeEventListener('mousedown', selectHandler, eventOptions);

			// Restore styles
			Object.assign(document.body.style, originalStyles);

			// Remove CSS
			style.remove();
		};
	}, [enabled]);
};
