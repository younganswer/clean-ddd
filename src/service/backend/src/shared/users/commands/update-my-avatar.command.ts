export class UpdateMyAvatarCommand {
  constructor(
    public readonly userId: string,
    public readonly input: { avatarUrl: string },
  ) {}
}
