'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateTimePickerProps {
	date: Date | undefined;
	setDate: (date: Date | undefined) => void;
	label?: string;
	placeholder?: string;
}

export function DateTimePicker({ date, setDate, label, placeholder }: DateTimePickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [timeValue, setTimeValue] = useState<string>(
		date ? format(date, 'HH:mm') : '00:00'
	);

	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (selectedDate) {
			// Preserve the time when selecting a new date
			const [hours, minutes] = timeValue.split(':').map(Number);
			selectedDate.setHours(hours, minutes);
			setDate(selectedDate);
		}
	};

	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newTime = e.target.value;
		setTimeValue(newTime);

		if (date) {
			const [hours, minutes] = newTime.split(':').map(Number);
			const newDate = new Date(date);
			newDate.setHours(hours, minutes);
			setDate(newDate);
		}
	};

	return (
		<div className='flex flex-col space-y-2'>
			{label && <Label>{label}</Label>}
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						variant='outline'
						className={cn(
							'justify-start text-left font-normal',
							!date && 'text-muted-foreground'
						)}
					>
						<CalendarIcon className='mr-2 h-4 w-4' />
						{date ? format(date, 'PPP HH:mm') : <span>{placeholder || 'Pick a date and time'}</span>}
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-auto p-0' align='start'>
					<Calendar
						mode='single'
						selected={date}
						onSelect={handleDateSelect}
						initialFocus
					/>
					<div className='p-3 border-t'>
						<Label htmlFor='time' className='text-sm'>
							Time
						</Label>
						<Input
							id='time'
							type='time'
							value={timeValue}
							onChange={handleTimeChange}
							className='mt-1'
						/>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
