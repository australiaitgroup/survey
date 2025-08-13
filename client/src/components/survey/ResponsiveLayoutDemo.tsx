import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import OneQuestionPerPageView from './OneQuestionPerPageView';

// 演示用的测试题目
const demoQuestions = [
	{
		_id: 'demo-1',
		text: '这是第一个测试题目：您更喜欢哪种学习方式？',
		description: '这里是题目的详细描述。在iPad及以上尺寸的屏幕上，这段描述应该显示在左侧栏中，而选项会显示在右侧栏中。您可以调整浏览器窗口大小来测试响应式效果。\n\n**请注意：**\n- 在≥768px宽度时，您会看到左右两栏布局\n- 在<768px宽度时，会显示上下单栏布局\n- 题目标题、描述在左侧，选项在右侧',
		type: 'single_choice',
		options: [
			{ text: '在线视频学习' },
			{ text: '阅读书籍和文档' },
			{ text: '实践项目练习' },
			{ text: '小组讨论学习' }
		]
	},
	{
		_id: 'demo-2',
		text: '第二个题目：您认为最重要的编程技能是什么？',
		description: '请根据您的经验选择最重要的技能。这个描述也会在大屏幕上显示在左侧，帮助您更好地理解题目要求。\n\n这个演示展示了我们刚刚实现的响应式布局功能：\n- 桌面和平板横屏：左右分栏显示\n- 手机和平板竖屏：上下单栏显示',
		type: 'single_choice',
		options: [
			{ text: '逻辑思维能力' },
			{ text: '代码调试技能' },
			{ text: '团队协作能力' },
			{ text: '持续学习能力' }
		]
	},
	{
		_id: 'demo-3',
		text: '第三个题目：关于响应式设计，您的看法是？',
		description: '响应式设计是现代Web开发的重要组成部分。这个题目用来测试我们刚刚实现的响应式布局功能。\n\n当您在不同屏幕尺寸下查看此页面时，布局会自动调整以提供最佳的用户体验。',
		type: 'single_choice',
		options: [
			{ text: '非常重要，必须掌握' },
			{ text: '比较重要，需要了解' },
			{ text: '一般重要，可选技能' },
			{ text: '不太重要，很少使用' }
		]
	}
];

const ResponsiveLayoutDemo: React.FC = () => {
	const { t } = useTranslation();
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [submitted, setSubmitted] = useState(false);

	const handleAnswerChange = (questionId: string, answer: string) => {
		setAnswers(prev => ({ ...prev, [questionId]: answer }));
	};

	const handleSubmit = () => {
		console.log('Demo answers:', answers);
		setSubmitted(true);
		setTimeout(() => {
			alert('演示完成！这就是响应式的 One Question Per Page 布局效果。');
			setSubmitted(false);
			setAnswers({});
		}, 1000);
	};

	if (submitted) {
		return (
			<div className='min-h-screen bg-[#F7F7F7] flex items-center justify-center'>
				<div className='bg-white rounded-xl p-8 text-center'>
					<div className='text-green-500 text-6xl mb-4'>✅</div>
					<h2 className='text-2xl font-bold text-gray-800 mb-2'>演示完成！</h2>
					<p className='text-gray-600'>响应式布局展示成功</p>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-[#F7F7F7] py-6 sm:py-12'>
			<div className='mx-auto px-3 sm:px-4 max-w-5xl'>
				{/* 页面标题 */}
				<div className='text-center mb-8'>
					<h1 className='text-3xl font-bold text-gray-800 mb-4'>
						响应式布局演示 - One Question Per Page
					</h1>
					<p className='text-gray-600 max-w-2xl mx-auto'>
						这是一个演示页面，展示了 Assessment 模式下的响应式两栏布局。
						请调整浏览器窗口大小来测试不同屏幕尺寸下的布局效果。
					</p>
					<div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
						<p className='text-blue-700 text-sm'>
							💡 <strong>提示：</strong> 
							在iPad宽度(≥768px)及以上时，题目和描述显示在左侧，选项显示在右侧。
							在手机宽度(&lt;768px)时，采用上下单栏布局。
						</p>
					</div>
				</div>

				{/* 调查表单 */}
				<div className='bg-white rounded-xl border border-[#EBEBEB] p-6'>
					<OneQuestionPerPageView
						questions={demoQuestions}
						answers={answers}
						onAnswerChange={handleAnswerChange}
						onSubmit={handleSubmit}
						loading={false}
						antiCheatEnabled={false}
						getInputProps={() => ({})}
						ignoreRequiredForNavigation={false}
					/>
				</div>
			</div>
		</div>
	);
};

export default ResponsiveLayoutDemo;