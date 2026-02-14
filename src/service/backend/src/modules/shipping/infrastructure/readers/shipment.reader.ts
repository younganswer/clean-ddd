import { Inject, Injectable } from '@nestjs/common';

import {
  IShipmentReaderSymbol,
  type IShipmentReader,
} from '@/shared/readers/shipping/i.shipment.reader';
import type { ShipmentView } from '@/shared/readers/shipping/dto/shipment.view';
import { IShipmentRepositorySymbol } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import type { IShipmentRepository } from '@/modules/shipping/domains/repositories/i.shipment.repository';

@Injectable()
export class ShipmentReader implements IShipmentReader {
  constructor(
    @Inject(IShipmentRepositorySymbol)
    private readonly shipments: IShipmentRepository,
  ) {}

  async findById(shipmentId: string): Promise<ShipmentView | null> {
    const s = await this.shipments.findById(shipmentId);
    if (!s) return null;
    return this.toView(s);
  }

  async findByOrderId(orderId: string): Promise<ShipmentView | null> {
    const s = await this.shipments.findByOrderId(orderId);
    if (!s) return null;
    return this.toView(s);
  }

  async findRecent(limit: number): Promise<ShipmentView[]> {
    const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
    const list = await this.shipments.findRecent(safeLimit);
    return list.map((s) => this.toView(s));
  }

  private toView(s: {
    id: string;
    orderId: string;
    status: ShipmentView['status'];
    createdAt: Date;
    updatedAt: Date;
  }): ShipmentView {
    return {
      shipmentId: s.id,
      orderId: s.orderId,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}

export const ShipmentReaderProvider = {
  provide: IShipmentReaderSymbol,
  useClass: ShipmentReader,
};
