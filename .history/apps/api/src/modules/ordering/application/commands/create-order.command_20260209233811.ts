export class CreateOrderCommand {
  constructor(
    public readonly input: {
      amount: number;
      currency: string;
    },
  ) {}
}
