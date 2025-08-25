import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LiveQuizProvider, useLiveQuiz } from '../../contexts/LiveQuizContext';
import { createMockLiveClient } from '../../utils/mockLiveClient';
import RadialCountdown from './RadialCountdown';

const ConnectionBadge: React.FC = () => {
	const { connectionStatus } = useLiveQuiz();
	const color = connectionStatus === 'connected' ? 'bg-emerald-500' : connectionStatus === 'retrying' ? 'bg-amber-500' : 'bg-gray-400';
	const label = connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'retrying' ? 'Retrying' : 'Disconnected';
	return (
		<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${color}`}>
			<span className='inline-block h-1.5 w-1.5 rounded-full bg-white'></span>
			{label}
		</span>
	);
};

const TopBar: React.FC = () => {
	const { name, score } = useLiveQuiz();
	return (
		<div className='w-full flex items-center justify-between px-4 py-2 border-b border-gray-200'>
			<div className='text-sm font-medium'>SigmaQ Live</div>
			<div className='flex items-center gap-3'>
				<div className='text-sm text-gray-600'>{name}</div>
				<div className='text-sm font-semibold'>Score: {score}</div>
				<ConnectionBadge />
			</div>
		</div>
	);
};

const LobbyView: React.FC = () => {
	return (
		<div className='flex flex-1 items-center justify-center p-6'>
			<div className='text-center'>
				<h2 className='text-xl font-bold mb-2'>Waiting for the host to start…</h2>
				<p className='text-gray-600'>Sit tight. The game will begin shortly.</p>
			</div>
		</div>
	);
};

const QuestionView: React.FC = () => {
	const { question, lastAnswer, selectAnswer, submitAnswer, submitted, currentView, remainingMs, remainingPct } = useLiveQuiz();
	if (!question) return null;
	const locked = currentView === 'locked' || remainingMs <= 0;
	const canInteract = !locked && !submitted;

	function handleOptionClick(key: string) {
		if (!canInteract) return;
		selectAnswer(key);
	}

	function handleSubmit() {
		if (!canInteract || !lastAnswer) return;
		submitAnswer();
	}
	return (
		<div className='flex-1 p-4 flex flex-col gap-4'>
			<div className='flex items-center justify-between'>
				<h2 className='text-lg font-semibold'>{question.prompt}</h2>
				<RadialCountdown remainingMs={remainingMs} remainingPct={remainingPct} />
			</div>
			<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
				{question.options.map((opt) => {
					const selected = lastAnswer === opt.key;
					return (
						<button
							key={opt.key}
							onClick={() => handleOptionClick(opt.key)}
							disabled={!canInteract}
							className={`rounded-xl border px-4 py-4 text-left text-base font-semibold transition active:scale-[0.98] ${
								selected ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-gray-300 hover:border-gray-400'
							} ${!canInteract ? 'opacity-60 cursor-not-allowed' : ''}`}
						>
							{opt.key}. {opt.label}
						</button>
					);
				})}
			</div>
			<div className='mt-2 flex items-center justify-between'>
				<div>
					{submitted && (
						<span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-medium'>
							<span className='h-1.5 w-1.5 rounded-full bg-emerald-600 inline-block'></span>
							Answer submitted
						</span>
					)}
				</div>
				<button
					onClick={handleSubmit}
					disabled={!canInteract || !lastAnswer}
					className='rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 active:scale-[0.98]'
				>
					Submit
				</button>
			</div>
		</div>
	);
};

const InnerSession: React.FC = () => {
	const { state } = useLocation() as { state?: { name?: string; email?: string } };
	const { sessionId } = useParams();
	const navigate = useNavigate();
	const { currentView, connectToSession, connectionStatus } = useLiveQuiz();

	useEffect(() => {
		if (!sessionId) return;
		const displayName = state?.name || 'Guest';
		connectToSession(sessionId, displayName);
	}, [sessionId]);

	useEffect(() => {
		if (!sessionId) navigate('/live/join');
	}, [sessionId]);

	return (
		<div className='min-h-screen flex flex-col bg-gray-50'>
			<TopBar />
			{connectionStatus !== 'connected' && (
				<div className='px-4 py-2 bg-amber-50 text-amber-800 text-sm border-b border-amber-200'>
					Connection lost. Attempting to reconnect…
				</div>
			)}
			{currentView === 'lobby' && <LobbyView />}
			{(currentView === 'question' || currentView === 'locked') && <QuestionView />}
		</div>
	);
};

const LiveSession: React.FC = () => {
	return (
		<LiveQuizProvider clientFactory={createMockLiveClient}>
			<InnerSession />
		</LiveQuizProvider>
	);
};

export default LiveSession;

