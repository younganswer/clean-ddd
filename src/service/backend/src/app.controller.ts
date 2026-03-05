import { Controller, Get } from '@nestjs/common';
import { MessageEnvelope, ResponseHelper } from '@/common/responses';
import { ApiMessageResponse } from '@/common/swagger';
import { AppService } from '@/app.service';
import { NestApp } from '@/nest-app';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	@ApiMessageResponse()
	getHello(): MessageEnvelope {
		return ResponseHelper.message(this.appService.getHello());
	}

	@Get('/app/health-check')
	@ApiMessageResponse()
	healthCheck(): MessageEnvelope {
		return ResponseHelper.message(NestApp.getName() || 'api');
	}
}
