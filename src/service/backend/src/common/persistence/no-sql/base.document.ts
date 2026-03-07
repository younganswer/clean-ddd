import type { ObjectId } from 'mongodb';

export class BaseDocument {
	constructor(uuid: string) {
		this.uuid = uuid;
	}

	_id?: ObjectId;
	uuid!: string;
	createdAt!: Date;
	updatedAt!: Date;
}
