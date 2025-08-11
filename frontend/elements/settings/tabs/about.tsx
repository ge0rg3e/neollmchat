import packageJson from '~server/../package.json';
import { useEffect, useState } from 'react';

const AboutTab = () => {
	const [isLatestVersion, setIsLatestVersion] = useState<boolean | undefined>(undefined);

	const checkVersion = async () => {
		const response = await fetch('https://raw.githubusercontent.com/ge0rg3e/neollmchat/main/package.json');
		const json = await response.json();

		setIsLatestVersion(json.version === packageJson.version);
	};

	useEffect(() => {
		checkVersion();
	}, []);

	return (
		<div className="size-full pl-3 space-y-5 animate-in fade-in">
			<h2 className="text-lg font-semibold">About NeoLLMChat</h2>
			<div className="space-y-2">
				<p>
					Version: v{packageJson.version} ({isLatestVersion === undefined ? 'Checking...' : isLatestVersion === true ? 'Latest' : 'Not latest'})
				</p>

				<p>
					Made with ☕ and ❤️ by{' '}
					<a href="https://github.com/ge0rg3e" className="underline" target="_blank" rel="noopener noreferrer">
						Ge0rg3e
					</a>
				</p>
			</div>
		</div>
	);
};

export default AboutTab;
