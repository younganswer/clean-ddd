export class GetOrderDetailBffQuery {
  constructor(
    public readonly input: {
      orderId: string;
      includePayment?: boolean;
      includeShipment?: boolean;
      includeReservations?: boolean;
    },
  ) {}
}
