import {
	CreateScheduleCommand,
	SchedulerClient,
} from '@aws-sdk/client-scheduler';
import { Injectable } from '@nestjs/common';
import { IOutboxDelayedDispatchTrigger } from '@/shared/outbox/domain/schedulers/i.outbox-delayed-dispatch-trigger';

const SCHEDULE_NAME_PREFIX = 'outbox-';

@Injectable()
export class OutboxDelayedDispatchTriggerAdapter implements IOutboxDelayedDispatchTrigger {
	private readonly enabled: boolean;
	private readonly targetArn?: string;
	private readonly roleArn?: string;
	private readonly scheduler: SchedulerClient;

	constructor() {
		const enabledRaw = process.env.OUTBOX_DELAYED_TRIGGER_ENABLED;
		this.enabled = enabledRaw ? enabledRaw !== 'false' : true;
		this.targetArn = process.env.OUTBOX_DELAYED_TRIGGER_TARGET_ARN;
		this.roleArn = process.env.OUTBOX_DELAYED_TRIGGER_ROLE_ARN;
		this.scheduler = new SchedulerClient({});
	}

	async scheduleOneShot(input: {
		outboxId: string;
		messageGroupId: string;
		delaySeconds: number;
	}): Promise<boolean> {
		if (!this.enabled) return false;
		if (!this.targetArn || !this.roleArn) return false;
		if (!Number.isFinite(input.delaySeconds) || input.delaySeconds <= 0)
			return false;

		const when = new Date(Date.now() + input.delaySeconds * 1_000);
		const scheduleExpression = `at(${when.toISOString().replace(/\.\d{3}Z$/, 'Z')})`;
		const scheduleName = `${SCHEDULE_NAME_PREFIX}${input.outboxId}`;

		const command = new CreateScheduleCommand({
			Name: scheduleName,
			ScheduleExpression: scheduleExpression,
			FlexibleTimeWindow: { Mode: 'OFF' },
			ActionAfterCompletion: 'DELETE',
			Target: {
				Arn: this.targetArn,
				RoleArn: this.roleArn,
				Input: JSON.stringify({
					outboxId: input.outboxId,
					messageGroupId: input.messageGroupId,
				}),
			},
		});

		try {
			await this.scheduler.send(command);
			return true;
		} catch (error: unknown) {
			const code =
				typeof error === 'object' && error !== null
					? (error as { name?: string }).name
					: undefined;
			if (code === 'ConflictException') {
				return true;
			}
			return false;
		}
	}
}
