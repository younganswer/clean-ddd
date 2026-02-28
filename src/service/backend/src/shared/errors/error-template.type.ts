import { HttpStatus } from '@nestjs/common';

export type ErrorTemplate = {
	code: string;
	message: string;
	status: HttpStatus;
};
