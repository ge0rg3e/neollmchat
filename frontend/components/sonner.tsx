'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useApp } from '~frontend/lib/context';

const Toaster = ({ ...props }: ToasterProps) => {
	const { appearance } = useApp();

	return (
		<Sonner
			className="toaster group"
			theme={appearance.theme}
			style={
				{
					'--normal-bg': 'var(--popover)',
					'--normal-text': 'var(--popover-foreground)',
					'--normal-border': 'var(--border)'
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
