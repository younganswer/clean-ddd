export type CreateShipmentForOrderResult = {
  shipmentId: string;
};

export class CreateShipmentForOrderCommand {
  constructor(public readonly orderId: string) {}
}
