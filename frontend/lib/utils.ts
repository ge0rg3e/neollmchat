import { twMerge as _twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { useState, useEffect } from 'react';

export const twMerge = (...inputs: ClassValue[]) => _twMerge(clsx(inputs));

export const useScreen = () => {
	const [size, setSize] = useState({
		width: window.innerWidth,
		height: window.innerHeight
	});

	const handleResize = () => {
		setSize({
			width: window.innerWidth,
			height: window.innerHeight
		});
	};

	useEffect(() => {
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return {
		size
	};
};

export const truncateString = (str: string, maxLength: number): string => {
	if (str.length <= maxLength) {
		return str;
	}
	return str.slice(0, maxLength) + '...';
};

export const formatDateGroup = (date: Date): string => {
	const now = new Date();
	const diffTime = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 0) {
		return 'Today';
	} else if (diffDays === 1) {
		return 'Yesterday';
	} else if (diffDays < 30) {
		return `${diffDays} days ago`;
	} else if (diffDays < 365) {
		const diffMonths = Math.floor(diffDays / 30);
		return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
	} else {
		const diffYears = Math.floor(diffDays / 365);
		return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
	}
};

export const scrollToLastMessage = () => {
	const chatMessages = document.getElementById('chat-messages');
	if (!chatMessages) return;
	chatMessages.scroll({ top: chatMessages.scrollHeight, behavior: 'smooth' });
};
