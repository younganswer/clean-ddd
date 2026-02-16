import { IsString, IsUrl } from 'class-validator';

export class UpdateMyAvatarRequest {
  @IsString()
  @IsUrl()
  avatarUrl!: string;
}
