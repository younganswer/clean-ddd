import { HttpStatus } from '@nestjs/common';
import { ErrorTemplate } from '@/common/errors/error-template.type';

export const USER_DOMAIN_ERRORS = {
	AVATAR_USER_ID_REQUIRED: {
		code: 'AVATAR_USER_ID_REQUIRED',
		message: 'userId is required',
		status: HttpStatus.BAD_REQUEST,
	},
	AVATAR_IMAGE_URL_REQUIRED: {
		code: 'AVATAR_IMAGE_URL_REQUIRED',
		message: 'imageUrl is required',
		status: HttpStatus.BAD_REQUEST,
	},
	USER_AVATAR_ID_REQUIRED: {
		code: 'USER_AVATAR_ID_REQUIRED',
		message: 'avatarId is required',
		status: HttpStatus.BAD_REQUEST,
	},
} as const satisfies Record<string, ErrorTemplate>;

export const USER_APPLICATION_ERRORS = {
	USER_ID_REQUIRED: {
		code: 'USER_ID_REQUIRED',
		message: 'userId is required',
		status: HttpStatus.BAD_REQUEST,
	},
	USER_AVATAR_URL_REQUIRED: {
		code: 'USER_AVATAR_URL_REQUIRED',
		message: 'avatarUrl is required',
		status: HttpStatus.BAD_REQUEST,
	},
	USER_NOT_FOUND: {
		code: 'USER_NOT_FOUND',
		message: 'user not found',
		status: HttpStatus.NOT_FOUND,
	},
} as const satisfies Record<string, ErrorTemplate>;

export const USER_INFRA_ERRORS = {
	DYNAMODB_AVATAR_UPSERT_FAILED: {
		code: 'DYNAMODB_AVATAR_UPSERT_FAILED',
		message: 'Failed to upsert avatar item in DynamoDB',
		status: HttpStatus.SERVICE_UNAVAILABLE,
	},
	DYNAMODB_AVATAR_TABLE_REQUIRED: {
		code: 'DYNAMODB_AVATAR_TABLE_REQUIRED',
		message:
			'Missing required env: DYNAMODB_AVATAR_TABLE (when using DynamoDB avatar repository)',
		status: HttpStatus.SERVICE_UNAVAILABLE,
	},
	MONGODB_URL_REQUIRED: {
		code: 'MONGODB_URL_REQUIRED',
		message: 'MONGODB_URL is required to upsert avatar',
		status: HttpStatus.SERVICE_UNAVAILABLE,
	},
	MONGODB_AVATAR_UPSERT_FAILED: {
		code: 'MONGODB_AVATAR_UPSERT_FAILED',
		message: 'Failed to upsert avatar document',
		status: HttpStatus.SERVICE_UNAVAILABLE,
	},
} as const satisfies Record<string, ErrorTemplate>;
