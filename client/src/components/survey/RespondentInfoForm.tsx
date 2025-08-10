import React from 'react';

interface RespondentInfoFormProps {
	name: string;
	email: string;
	onNameChange: (v: string) => void;
	onEmailChange: (v: string) => void;
	showLoading?: boolean;
	getInputProps: () => Record<string, any>;
}

const RespondentInfoForm: React.FC<RespondentInfoFormProps> = ({
	name,
	email,
	onNameChange,
	onEmailChange,
	showLoading,
	getInputProps,
}) => {
	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 gap-6 animate-slide-down'>
			<div>
				<label className='block mb-3 font-medium text-[#484848]'>👤 Full Name *</label>
				<input
					className='input-field'
					value={name}
					onChange={e => onNameChange(e.target.value)}
					required
					placeholder='Enter your full name'
					{...getInputProps()}
				/>
			</div>
			<div className='sm:col-span-1'>
				<label className='block mb-3 font-medium text-[#484848]'>✉️ Email Address *</label>
				<input
					type='email'
					className='input-field'
					value={email}
					onChange={e => onEmailChange(e.target.value)}
					required
					placeholder='Enter your email address'
					{...getInputProps()}
				/>
				{showLoading && (
					<div className='text-sm text-[#00A699] mt-2 flex items-center gap-2'>
						<div className='w-4 h-4 border-2 border-[#00A699] border-t-transparent rounded-full animate-spin'></div>
						Loading randomized questions...
					</div>
				)}
			</div>
		</div>
	);
};

export default RespondentInfoForm;
