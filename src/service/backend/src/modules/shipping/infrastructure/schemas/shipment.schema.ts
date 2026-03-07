import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { ShipmentStatus } from '@/modules/shipping/domains/enums/shipment-status.enum';
import { BaseSchema } from '@/common/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'shipments' })
@Unique({ properties: ['orderId'] })
@Index({ properties: ['createdAt'] })
export class ShipmentSchema extends BaseSchema {
	constructor(input: ShipmentSchemaConstructorInput) {
		super(input.uuid);
		this.orderId = input.orderId;
		this.status = input.status ?? ShipmentStatus.PENDING;
	}

	@Property({ type: 'uuid' })
	orderId!: string;

	@Property({ type: 'string' })
	status: ShipmentStatus = ShipmentStatus.PENDING;
}

type ShipmentSchemaConstructorInput = Omit<
	ShipmentSchema,
	'id' | 'createdAt' | 'updatedAt' | 'status'
> &
	Partial<Pick<ShipmentSchema, 'status'>>;
