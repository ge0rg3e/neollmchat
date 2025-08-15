import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { useState, useEffect } from 'react';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

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

export const scrollToLastMessage = () => {
	const chatMessages = document.getElementById('chat-messages');
	if (!chatMessages) return;
	chatMessages.scroll({ top: chatMessages.scrollHeight, behavior: 'smooth' });
};
