export const ACCESS_TOKEN_EXP = 30 * 60; // 30 mins
export const REFRESH_TOKEN_EXP = 7 * 86400; // 7 days

export const getExpTimestamp = (seconds: number) => {
	const currentTimeMillis = Date.now();
	const secondsIntoMillis = seconds * 1000;
	const expirationTimeMillis = currentTimeMillis + secondsIntoMillis;

	return Math.floor(expirationTimeMillis / 1000);
};
