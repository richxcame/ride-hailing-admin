'use client';

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox';
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
}

/**
 * A controlled, searchable single-select that takes a flat list of
 * `{ id, label }` options and emits the selected id (or `''` when cleared).
 *
 * Wraps the Base UI Combobox primitive — typing in the input filters items
 * client-side by label, so it scales to a few hundred options comfortably.
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
}: EntityComboboxProps) {
	if (isLoading) {
		return <Skeleton className={cn('h-9 w-64', className)} />;
	}

	const selected = items.find((i) => i.id === value) ?? null;

	return (
		<Combobox<EntityOption>
			items={items}
			value={selected}
			onValueChange={(next) => onChange(next?.id ?? '')}
			itemToStringLabel={(o) => o.label}
			itemToStringValue={(o) => o.id}
			isItemEqualToValue={(a, b) => a.id === b.id}
		>
			<ComboboxInput
				placeholder={placeholder}
				disabled={disabled}
				className={className}
			/>
			<ComboboxContent>
				<ComboboxList>
					{(item: EntityOption) => (
						<ComboboxItem key={item.id} value={item}>
							{item.label}
						</ComboboxItem>
					)}
				</ComboboxList>
				<ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
			</ComboboxContent>
		</Combobox>
	);
}
