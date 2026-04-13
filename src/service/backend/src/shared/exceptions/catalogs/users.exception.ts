import { HttpStatus } from '@nestjs/common';
import {
	BaseException,
	BaseExceptionOptions,
	FactoryScopedExceptionMetadata,
	resolveFactoryScopedExceptionMetadata,
} from '@/common/exceptions/base.exception';
import { ExceptionScope } from '@/common/exceptions/exception-scope.enum';

export class UserException extends BaseException {
	static readonly factoryScoped = true as const;
	static readonly status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
	static readonly code: string = 'UNEXPECTED_ERROR';

	constructor(scope: ExceptionScope, options?: BaseExceptionOptions) {
		const { response, status, code } =
			resolveFactoryScopedExceptionMetadata(
				new.target as FactoryScopedExceptionMetadata,
			);
		super(response, status, code, scope, options);
	}
}

export class UserDomainAvatarUserIdRequiredException extends UserException {
	static readonly message = 'userId is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'AVATAR_USER_ID_REQUIRED';
}

export class UserDomainAvatarImageUrlRequiredException extends UserException {
	static readonly message = 'imageUrl is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'AVATAR_IMAGE_URL_REQUIRED';
}

export class UserDomainUserAvatarIdRequiredException extends UserException {
	static readonly message = 'avatarId is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'USER_AVATAR_ID_REQUIRED';
}

export class UserApplicationUserIdRequiredException extends UserException {
	static readonly message = 'userId is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'USER_ID_REQUIRED';
}

export class UserApplicationUserAvatarUrlRequiredException extends UserException {
	static readonly message = 'avatarUrl is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'USER_AVATAR_URL_REQUIRED';
}

export class UserApplicationUserNotFoundException extends UserException {
	static readonly message = 'user not found';
	static readonly status = HttpStatus.NOT_FOUND;
	static readonly code = 'USER_NOT_FOUND';
}

export class UserInfraDynamodbAvatarUpsertFailedException extends UserException {
	static readonly message = 'Failed to upsert avatar item in DynamoDB';
	static readonly status = HttpStatus.SERVICE_UNAVAILABLE;
	static readonly code = 'DYNAMODB_AVATAR_UPSERT_FAILED';
}

export class UserInfraDynamodbAvatarTableRequiredException extends UserException {
	static readonly message =
		'Missing required env: DYNAMODB_AVATAR_TABLE (when using DynamoDB avatar repository)';
	static readonly status = HttpStatus.SERVICE_UNAVAILABLE;
	static readonly code = 'DYNAMODB_AVATAR_TABLE_REQUIRED';
}

export class UserInfraMongodbUrlRequiredException extends UserException {
	static readonly message = 'MONGODB_URL is required to upsert avatar';
	static readonly status = HttpStatus.SERVICE_UNAVAILABLE;
	static readonly code = 'MONGODB_URL_REQUIRED';
}

export class UserInfraMongodbAvatarUpsertFailedException extends UserException {
	static readonly message = 'Failed to upsert avatar document';
	static readonly status = HttpStatus.SERVICE_UNAVAILABLE;
	static readonly code = 'MONGODB_AVATAR_UPSERT_FAILED';
}
