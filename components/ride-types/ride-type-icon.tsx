'use client';

import { useState } from 'react';
import { IconCar, IconCube } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

// 3D model formats we can't render inline with a plain <img>. Everything else
// (PNG/WebP/SVG/… or an unknown/extensionless URL) is tried as an image first
// and falls back to the model chip if it fails to load.
const MODEL_EXT = /\.(glb|gltf|usdz)(\?.*)?$/i;

// The `icon` field is free text that usually holds a label ("economy", "xl"),
// not a glyph — so only render it when it's an actual emoji, otherwise it
// overflows the icon box. Everything else falls back to the default placeholder.
const EMOJI_RE = /\p{Extended_Pictographic}/u;

const SIZES = {
	sm: 'h-7 w-7',
	md: 'h-10 w-10',
	lg: 'h-16 w-16',
} as const;

const GLYPH_SIZES = {
	sm: 'text-base',
	md: 'text-xl',
	lg: 'text-3xl',
} as const;

const ICON_SIZES = {
	sm: 'h-4 w-4',
	md: 'h-5 w-5',
	lg: 'h-7 w-7',
} as const;

interface RideTypeIconProps {
	/** Public URL to a 2D image or 3D model. */
	iconUrl?: string | null;
	/** Short text/emoji icon; only rendered when it's an actual emoji. */
	icon?: string | null;
	/** Ride type name, used for the image alt text. */
	name?: string;
	size?: keyof typeof SIZES;
	className?: string;
}

/**
 * Renders the best available visual for a ride type: an inline image for 2D
 * assets, a linked chip for 3D models (which a browser can't thumbnail without
 * a heavy viewer), an emoji if one is set, or a neutral car placeholder.
 */
export function RideTypeIcon({ iconUrl, icon, name, size = 'sm', className }: RideTypeIconProps) {
	const url = iconUrl?.trim() ?? '';
	const [failedUrl, setFailedUrl] = useState<string | null>(null);

	const sizeClass = SIZES[size];
	const isModel = MODEL_EXT.test(url);
	const imgFailed = url !== '' && failedUrl === url;

	// 2D image.
	if (url && !isModel && !imgFailed) {
		return (
			// eslint-disable-next-line @next/next/no-img-element -- arbitrary external/MinIO URLs, not statically optimizable
			<img
				src={url}
				alt={name ? `${name} icon` : 'ride type icon'}
				onError={() => setFailedUrl(url)}
				className={cn(sizeClass, 'shrink-0 rounded border object-contain bg-muted', className)}
			/>
		);
	}

	// 3D model (or an image URL that failed to load): a chip linking to the asset.
	if (url) {
		return (
			<a
				href={url}
				target='_blank'
				rel='noreferrer'
				title={url}
				className={cn(
					sizeClass,
					'inline-flex shrink-0 items-center justify-center rounded border bg-muted text-muted-foreground transition-colors hover:text-foreground',
					className,
				)}
			>
				<IconCube className={ICON_SIZES[size]} />
			</a>
		);
	}

	// Emoji glyph, only when the icon field actually holds one.
	if (icon && EMOJI_RE.test(icon)) {
		return (
			<span
				className={cn(
					sizeClass,
					GLYPH_SIZES[size],
					'inline-flex shrink-0 items-center justify-center overflow-hidden leading-none',
					className,
				)}
			>
				{icon}
			</span>
		);
	}

	// Default: a clean, neutral placeholder.
	return (
		<span
			className={cn(
				sizeClass,
				'inline-flex shrink-0 items-center justify-center rounded border bg-muted text-muted-foreground',
				className,
			)}
		>
			<IconCar className={ICON_SIZES[size]} />
		</span>
	);
}
