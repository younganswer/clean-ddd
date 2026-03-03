import { Controller, Get } from '@nestjs/common';
import { MessageResponse } from '@/common/responses';
import { ApiMessageResponse } from '@/common/swagger';
import { AppService } from '@/app.service';
import { NestApp } from '@/nest-app';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	@ApiMessageResponse()
	getHello(): MessageResponse {
		return MessageResponse.from(this.appService.getHello());
	}

	@Get('/app/health-check')
	@ApiMessageResponse()
	healthCheck(): MessageResponse {
		return MessageResponse.from(NestApp.getName() || 'api');
	}
}
