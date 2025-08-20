import type { LiveClientLike, LiveEventPayloads, LiveEventType, LiveQuestion } from '../contexts/LiveQuizContext';

type HandlerMap = {
	[K in LiveEventType]?: Array<(payload: any) => void>;
};

export function createMockLiveClient(): LiveClientLike {
	let handlers: HandlerMap = {};
	let intervalId: number | null = null;
	let connected = true;
	let simulateDrops = true;

	function emit<K extends LiveEventType>(event: K, payload: LiveEventPayloads[K]) {
		handlers[event]?.forEach((h) => h(payload));
	}

	function connect(sessionId: string, userId: string, name: string) {
		// Simulate server lifecycle: lobby -> question -> lock -> result
		window.setTimeout(() => emit('session_started', {}), 300);

		// After a short lobby, send a question with a 10s timer
		window.setTimeout(() => {
			const serverNow = Date.now();
			const endsAt = serverNow + 10000;
			const question: LiveQuestion = {
				id: 'q1',
				prompt: 'What is 2 + 2?',
				options: [
					{ key: 'A', label: '3' },
					{ key: 'B', label: '4' },
					{ key: 'C', label: '5' },
					{ key: 'D', label: '22' },
				],
			};
			emit('question', { question, endsAt, serverNow });

			// Lock slightly after endsAt to test local lock behavior
			window.setTimeout(() => {
				emit('question_lock', { serverNow: Date.now() });
				window.setTimeout(() => {
					emit('question_result', { correctOptionKey: 'B', scoreDelta: 1000 });
				}, 800);
			}, 11000);
		}, 1000);

		// Simulate temporary disconnect and auto-reconnect to test UI banner
		if (simulateDrops) {
			let dropped = false;
			window.setTimeout(() => {
				if (dropped) return;
				dropped = true;
				connected = false;
				// Reconnect shortly after
				window.setTimeout(() => {
					connected = true;
				}, 1200);
			}, 2000);
		}
	}

	function disconnect() {
		if (intervalId) {
			window.clearInterval(intervalId);
			intervalId = null;
		}
	}

	function on<K extends LiveEventType>(event: K, handler: (payload: LiveEventPayloads[K]) => void) {
		if (!handlers[event]) handlers[event] = [];
		handlers[event]!.push(handler as any);
	}

	function off<K extends LiveEventType>(event: K, handler: (payload: LiveEventPayloads[K]) => void) {
		handlers[event] = (handlers[event] || []).filter((h) => h !== handler);
	}

	function sendAnswer(_optionKey: string) {
		// no-op for now in mock; could emit ack
	}

	return { connect, disconnect, on, off, sendAnswer };
}