export const logError = (description: string, err: any) => {
	let error = '';

	if (err && err.response && err.request) {
		error = err.response.data;
	} else if (err.stack !== undefined) {
		error = err.stack;
	} else if (err && typeof err === 'string') {
		error = err;
	} else error = "Error couldn't be parsed.";

	console.info(
		`[ERROR] ${description}`,
		JSON.stringify(
			{
				message: err.message ?? 'No message',
				error
			},
			null,
			4
		)
	);
};
