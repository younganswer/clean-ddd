export type BffPartialError = {
	domain: string;
	message: string;
};

export function toBffPartialError(
	domain: string,
	reason: unknown,
): BffPartialError {
	if (reason instanceof Error) {
		return {
			domain,
			message: reason.message,
		};
	}

	return {
		domain,
		message: String(reason),
	};
}
