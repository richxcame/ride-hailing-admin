'use client';

import { Badge } from '@/components/ui/badge';
import { PricingConfigLevel } from '@/lib/types/pricing';

const LEVEL_COLORS: Record<PricingConfigLevel, string> = {
	global: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
	country: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
	region: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
	city: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
	zone: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

interface InheritanceFieldProps {
	label: string;
	value: number | boolean | null | undefined;
	inheritedValue?: number | boolean | null;
	inheritedFrom?: string;
	sourceLevel?: PricingConfigLevel;
	type: 'currency' | 'percentage' | 'number' | 'boolean' | 'multiplier';
	/** ISO currency code for `type='currency'`; falls back to "$" when absent. */
	currencyCode?: string;
}

function formatValue(
	value: number | boolean | null | undefined,
	type: InheritanceFieldProps['type'],
	currencyCode?: string
): string {
	if (value === null || value === undefined) return '--';
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	switch (type) {
		case 'currency':
			if (currencyCode) {
				try {
					return new Intl.NumberFormat(undefined, {
						style: 'currency',
						currency: currencyCode,
					}).format(value);
				} catch {
					return `${currencyCode} ${value.toFixed(2)}`;
				}
			}
			return `$${value.toFixed(2)}`;
		case 'percentage':
			return `${value}%`;
		case 'multiplier':
			return `${value}x`;
		default:
			return String(value);
	}
}

export function InheritanceField({
	label,
	value,
	inheritedValue,
	inheritedFrom,
	sourceLevel,
	type,
	currencyCode,
}: InheritanceFieldProps) {
	const isExplicitlySet = value !== null && value !== undefined;
	const hasInheritedValue = inheritedValue !== null && inheritedValue !== undefined;

	return (
		<div className='flex items-center justify-between py-1.5'>
			<span className='text-sm text-muted-foreground'>{label}</span>
			<div className='flex items-center gap-2'>
				{isExplicitlySet ? (
					<>
						<span className='text-sm font-medium'>{formatValue(value, type, currencyCode)}</span>
						{sourceLevel && (
							<Badge variant='outline' className={`text-[10px] px-1.5 py-0 ${LEVEL_COLORS[sourceLevel]}`}>
								{sourceLevel}
							</Badge>
						)}
					</>
				) : hasInheritedValue ? (
					<>
						<span className='text-sm text-muted-foreground italic'>
							{formatValue(inheritedValue, type, currencyCode)}
						</span>
						{inheritedFrom && (
							<Badge variant='secondary' className='text-[10px] px-1.5 py-0'>
								from {inheritedFrom}
							</Badge>
						)}
					</>
				) : (
					<span className='text-sm text-muted-foreground'>--</span>
				)}
			</div>
		</div>
	);
}

export { LEVEL_COLORS };
