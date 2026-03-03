import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
	@ApiProperty()
	userId!: string;

	@ApiProperty()
	displayName!: string;

	@ApiProperty()
	email!: string;

	@ApiProperty({ required: false })
	avatarId?: string;

	@ApiProperty({ required: false })
	avatarUrl?: string;
}

export class UpdateAvatarResultResponseDto {
	@ApiProperty()
	avatarId!: string;

	@ApiProperty()
	avatarUrl!: string;
}
