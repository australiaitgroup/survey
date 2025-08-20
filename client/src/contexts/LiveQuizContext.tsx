import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

export type LiveView = 'lobby' | 'question' | 'locked' | 'feedback' | 'leaderboard' | 'end';

export interface LiveQuestionOption {
	key: string;
	label: string;
}

export interface LiveQuestion {
	id: string;
	prompt: string;
	options: LiveQuestionOption[];
}

export interface LiveQuizState {
	sessionId: string | null;
	userId: string | null;
	name: string | null;
	connected: boolean;
	connectionStatus: 'connected' | 'retrying' | 'disconnected';
	currentView: LiveView;
	question: LiveQuestion | null;
	endsAt: number | null; // server epoch ms
	serverNow: number | null; // server epoch ms at last sync
	lastAnswer: string | null;
	score: number;
}

export type LiveEventType =
	| 'session_started'
	| 'question'
	| 'question_lock'
	| 'question_result'
	| 'leaderboard'
	| 'session_end';

export interface LiveEventPayloads {
	question: { question: LiveQuestion; endsAt: number; serverNow: number };
	question_lock: { serverNow: number };
	question_result: { correctOptionKey: string; scoreDelta: number };
	leaderboard: { top: Array<{ name: string; score: number }>; score: number };
	session_end: {};
	session_started: {};
}

export interface LiveClientLike {
	connect: (sessionId: string, userId: string, name: string) => void;
	disconnect: () => void;
	on: <K extends LiveEventType>(event: K, handler: (payload: LiveEventPayloads[K]) => void) => void;
	off: <K extends LiveEventType>(event: K, handler: (payload: LiveEventPayloads[K]) => void) => void;
	sendAnswer?: (optionKey: string) => void;
}

export interface LiveQuizContextValue extends LiveQuizState {
	connectToSession: (sessionId: string, name: string) => void;
	disconnect: () => void;
	selectAnswer: (optionKey: string) => void;
	remainingMs: number;
	remainingPct: number; // 0..1
}

const initialState: LiveQuizState = {
	sessionId: null,
	userId: null,
	name: null,
	connected: false,
	connectionStatus: 'disconnected',
	currentView: 'lobby',
	question: null,
	endsAt: null,
	serverNow: null,
	lastAnswer: null,
	score: 0,
};

type Action =
	| { type: 'SET_CONNECTION'; connected: boolean; status: LiveQuizState['connectionStatus'] }
	| { type: 'JOINED'; sessionId: string; userId: string; name: string }
	| { type: 'SET_VIEW'; view: LiveView }
	| { type: 'QUESTION'; question: LiveQuestion; endsAt: number; serverNow: number }
	| { type: 'LOCK'; serverNow: number }
	| { type: 'ANSWER'; optionKey: string }
	| { type: 'RESULT'; scoreDelta: number }
	| { type: 'END' };

function reducer(state: LiveQuizState, action: Action): LiveQuizState {
	switch (action.type) {
		case 'SET_CONNECTION':
			return { ...state, connected: action.connected, connectionStatus: action.status };
		case 'JOINED':
			return {
				...state,
				sessionId: action.sessionId,
				userId: action.userId,
				name: action.name,
				currentView: 'lobby',
				lastAnswer: null,
				score: 0,
			};
		case 'SET_VIEW':
			return { ...state, currentView: action.view };
		case 'QUESTION':
			return {
				...state,
				currentView: 'question',
				question: action.question,
				endsAt: action.endsAt,
				serverNow: action.serverNow,
				lastAnswer: null,
			};
		case 'LOCK':
			return { ...state, currentView: 'locked', serverNow: action.serverNow };
		case 'ANSWER':
			return { ...state, lastAnswer: action.optionKey };
		case 'RESULT':
			return { ...state, currentView: 'feedback', score: state.score + action.scoreDelta };
		case 'END':
			return { ...state, currentView: 'end' };
		default:
			return state;
	}
}

const LiveQuizContext = createContext<LiveQuizContextValue | undefined>(undefined);

function generateUserId(): string {
	return 'u_' + Math.random().toString(36).slice(2, 10);
}

export const LiveQuizProvider: React.FC<{ children: React.ReactNode; clientFactory: () => LiveClientLike }> = ({ children, clientFactory }) => {
	const [state, dispatch] = useReducer(reducer, initialState);
	const clientRef = useRef<LiveClientLike | null>(null);
	const questionStartLocalTimeRef = useRef<number | null>(null);
	const lastServerNowAtQuestionRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

	const connectToSession = useCallback(
		(sessionId: string, name: string) => {
			const userId = generateUserId();
			dispatch({ type: 'JOINED', sessionId, userId, name });
			if (!clientRef.current) {
				clientRef.current = clientFactory();
			}
			const client = clientRef.current;
			client.connect(sessionId, userId, name);
			dispatch({ type: 'SET_CONNECTION', connected: true, status: 'connected' });

			const handleSessionStarted = () => {
				dispatch({ type: 'SET_VIEW', view: 'lobby' });
			};
			const handleQuestion = (payload: LiveEventPayloads['question']) => {
				questionStartLocalTimeRef.current = performance.now();
				lastServerNowAtQuestionRef.current = payload.serverNow;
				dispatch({ type: 'QUESTION', question: payload.question, endsAt: payload.endsAt, serverNow: payload.serverNow });
			};
			const handleLock = (payload: LiveEventPayloads['question_lock']) => {
				dispatch({ type: 'LOCK', serverNow: payload.serverNow });
			};
			const handleResult = (payload: LiveEventPayloads['question_result']) => {
				dispatch({ type: 'RESULT', scoreDelta: payload.scoreDelta });
			};
			const handleEnd = () => {
				dispatch({ type: 'END' });
			};

			client.on('session_started', handleSessionStarted);
			client.on('question', handleQuestion);
			client.on('question_lock', handleLock);
			client.on('question_result', handleResult);
			client.on('session_end', handleEnd);
		},
		[clientFactory]
	);

	const disconnect = useCallback(() => {
		if (clientRef.current) {
			clientRef.current.disconnect();
		}
		dispatch({ type: 'SET_CONNECTION', connected: false, status: 'disconnected' });
	}, []);

	const selectAnswer = useCallback((optionKey: string) => {
		dispatch({ type: 'ANSWER', optionKey });
		if (clientRef.current?.sendAnswer) {
			clientRef.current.sendAnswer(optionKey);
		}
	}, []);

	// Time sync: compute remaining based on serverNow and local high-res elapsed

	// Drive countdown with a RAF tick stored in refs and mirrored via state changes that re-render parent consumers
	const [tick, setTick] = React.useState(0);
	useEffect(() => {
		function loop() {
			setTick((t) => (t + 1) % 1000000);
			rafRef.current = requestAnimationFrame(loop);
		}
		// Only animate when in question/locked
		if (state.currentView === 'question' || state.currentView === 'locked') {
			rafRef.current = requestAnimationFrame(loop);
			return () => {
				if (rafRef.current) cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			};
		}
		return () => {};
	}, [state.currentView]);

	const { remainingMs, remainingPct } = useMemo(() => {
		const endsAt = state.endsAt;
		const serverNowAtQuestion = lastServerNowAtQuestionRef.current;
		const questionStartLocal = questionStartLocalTimeRef.current;
		if (!endsAt || !serverNowAtQuestion || !questionStartLocal) {
			return { remainingMs: 0, remainingPct: 0 };
		}
		const now = serverNowAtQuestion + (performance.now() - questionStartLocal);
		const remaining = Math.max(0, endsAt - now);
		const total = endsAt - serverNowAtQuestion;
		const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
		return { remainingMs: remaining, remainingPct: pct };
	}, [state.endsAt, state.serverNow, state.currentView, tick]);

	// Local lock when countdown hits 0 and server has not locked yet
	useEffect(() => {
		if (state.currentView === 'question' && remainingMs <= 0) {
			dispatch({ type: 'SET_VIEW', view: 'locked' });
		}
	}, [state.currentView, remainingMs]);

	const value: LiveQuizContextValue = {
		...state,
		connectToSession,
		disconnect,
		selectAnswer,
		remainingMs,
		remainingPct,
	};

	return <LiveQuizContext.Provider value={value}>{children}</LiveQuizContext.Provider>;
};

export function useLiveQuiz(): LiveQuizContextValue {
	const ctx = useContext(LiveQuizContext);
	if (!ctx) throw new Error('useLiveQuiz must be used within LiveQuizProvider');
	return ctx;
}

