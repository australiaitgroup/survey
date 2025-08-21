// ULTIMATE Anti-cheat script - ALWAYS ACTIVE
console.log('🚀 ULTIMATE Anti-cheat loading...');

(function () {
	'use strict';

	// Status indicator (disabled for cleaner UI)
	function showStatus() {
		// Red banner removed for better user experience
		// Protection is still active, just invisible
	}

	// Universal blocker
	function universalBlock(e) {
		// Only block if we should be active
		if (!shouldActivate()) return;

		const type = e.type;
		const key = e.key ? e.key.toLowerCase() : '';
		const ctrl = e.ctrlKey || e.metaKey;

		// Block ALL keyboard shortcuts when Ctrl is pressed
		if (ctrl) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			alert('⚠️ 为保证测评公平，快捷键已被禁用');
			return false;
		}

		// Block F12
		if (key === 'f12') {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			alert('⚠️ 为保证测评公平，开发者工具已被禁用');
			return false;
		}

		// Block right click
		if (type === 'contextmenu') {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			alert('⚠️ 为保证测评公平，右键菜单已被禁用');
			return false;
		}

		// Block clipboard events
		if (['copy', 'cut', 'paste'].includes(type)) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			alert(
				`⚠️ 为保证测评公平，${type === 'copy' ? '复制' : type === 'cut' ? '剪切' : '粘贴'}功能已被禁用`
			);
			return false;
		}

		// Block selection
		if (['selectstart', 'dragstart'].includes(type)) {
			e.preventDefault();
			return false;
		}
	}

	let isActive = false;

	// Check if we should activate protection based on URL
	function shouldActivate() {
		const path = window.location.pathname;
		// Only activate on user survey pages, NOT admin pages
		return path.match(/^\/survey\/[^/]+$/);
	}

	// Immediate activation
	function activate() {
		if (!shouldActivate()) {
			if (isActive) {
				console.log('🛡️ Anti-cheat deactivated (not on survey page)');
				deactivate();
			}
			return;
		}

		if (isActive) return; // Already active

		isActive = true;
		console.log('🛡️ Anti-cheat activated for survey page');

		// Add universal event listener to EVERYTHING
		const events = [
			'keydown',
			'keyup',
			'keypress',
			'contextmenu',
			'copy',
			'cut',
			'paste',
			'selectstart',
			'dragstart',
			'mousedown',
			'mouseup',
		];

		events.forEach(eventType => {
			// Add to document with highest priority
			document.addEventListener(eventType, universalBlock, {
				capture: true,
				passive: false,
				once: false,
			});

			// Add to window as backup
			window.addEventListener(eventType, universalBlock, {
				capture: true,
				passive: false,
				once: false,
			});
		});

		// Disable selection everywhere
		const style = document.createElement('style');
		style.id = 'anti-cheat-style';
		style.innerHTML = `
            *, *::before, *::after {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
                -webkit-user-drag: none !important;
            }
            input, textarea, [contenteditable] {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }
        `;

		if (document.head) {
			document.head.appendChild(style);
		} else {
			setTimeout(() => document.head.appendChild(style), 100);
		}

		showStatus();
	}

	// Deactivate protection
	function deactivate() {
		if (!isActive) return;
		isActive = false;

		// Remove style
		const style = document.getElementById('anti-cheat-style');
		if (style) style.remove();

		// Note: Event listeners are harder to remove cleanly, but they'll check shouldActivate()
	}

	// Check and activate based on current page
	function checkAndActivate() {
		activate();
	}

	// Activate immediately
	checkAndActivate();

	// Also activate when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', checkAndActivate);
	}

	// Check every few seconds for navigation changes
	setInterval(checkAndActivate, 3000);
})();

console.log('✅ ULTIMATE Anti-cheat loaded and ACTIVE');
