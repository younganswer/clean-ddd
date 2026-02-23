import { CommandBus, QueryBus } from '@nestjs/cqrs';

export const executeCommand = async <TResult>(
	commandBus: CommandBus,
	command: object,
): Promise<TResult> => {
	return await commandBus.execute(command as never);
};

export const executeQuery = async <TResult>(
	queryBus: QueryBus,
	query: object,
): Promise<TResult> => {
	return await queryBus.execute(query as never);
};
