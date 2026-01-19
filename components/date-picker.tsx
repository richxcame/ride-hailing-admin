'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

interface DatePickerProps {
	date: Date | undefined;
	setDate: (date: Date | undefined) => void;
	label?: string | React.ReactNode;
	placeholder?: string;
}

export function DatePicker({ date, setDate, label, placeholder }: DatePickerProps) {
	const [isOpen, setIsOpen] = useState(false);

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
						{date ? format(date, 'PPP') : <span>{placeholder || 'Pick a date'}</span>}
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-auto p-0' align='start'>
					<Calendar
						mode='single'
						selected={date}
						onSelect={(selectedDate) => {
							setDate(selectedDate);
							setIsOpen(false);
						}}
						initialFocus
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
