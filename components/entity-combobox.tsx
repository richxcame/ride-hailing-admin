'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface EntityOption {
	id: string;
	label: string;
}

interface EntityComboboxProps {
	items: EntityOption[];
	value: string;
	onChange: (id: string) => void;
	placeholder?: string;
	emptyMessage?: string;
	isLoading?: boolean;
	disabled?: boolean;
	className?: string;
	/** Show a button to clear the current selection. Defaults to true. */
	clearable?: boolean;
}

/**
 * A controlled, searchable single-select. Takes a flat `{ id, label }` list and
 * emits the selected id (or `''` when cleared).
 *
 * Implemented as a Popover + filtered list so selection and display are fully
 * deterministic, rather than relying on a combobox primitive's internal state.
 */
export function EntityCombobox({
	items,
	value,
	onChange,
	placeholder = 'Search…',
	emptyMessage = 'No results found',
	isLoading,
	disabled,
	className,
	clearable = true,
}: EntityComboboxProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');

	const selected = items.find((i) => i.id === value) ?? null;

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return items;
		return items.filter((i) => i.label.toLowerCase().includes(q));
	}, [items, query]);

	if (isLoading) {
		return <Skeleton className={cn('h-9 w-full', className)} />;
	}

	const select = (id: string) => {
		onChange(id);
		setQuery('');
		setOpen(false);
	};

	return (
		<Popover
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) setQuery('');
			}}
		>
			<PopoverTrigger asChild>
				<Button
					type='button'
					variant='outline'
					role='combobox'
					aria-expanded={open}
					disabled={disabled}
					className={cn(
						'h-9 justify-between font-normal',
						!selected && 'text-muted-foreground',
						className,
					)}
				>
					<span className='truncate'>
						{selected ? selected.label : placeholder}
					</span>
					<ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align='start'
				className='w-(--radix-popover-trigger-width) min-w-52 gap-0 p-0'
			>
				<div className='border-b p-2'>
					<Input
						autoFocus
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={placeholder}
						className='h-8'
					/>
				</div>
				<div className='max-h-60 overflow-y-auto p-1'>
					{clearable && selected && (
						<button
							type='button'
							onClick={() => select('')}
							className='text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm'
						>
							<X className='size-4' />
							Clear selection
						</button>
					)}
					{filtered.length === 0 ? (
						<div className='text-muted-foreground py-6 text-center text-sm'>
							{emptyMessage}
						</div>
					) : (
						filtered.map((item) => (
							<button
								key={item.id}
								type='button'
								onClick={() => select(item.id)}
								className={cn(
									'hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
									item.id === value && 'bg-accent',
								)}
							>
								<span className='truncate'>{item.label}</span>
								{item.id === value && <Check className='size-4 shrink-0' />}
							</button>
						))
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
