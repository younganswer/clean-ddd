import { Controller, Get } from '@nestjs/common';
import { MessageEnvelope, ResponseHelper } from '@/common/responses';
import { ApiMessageResponse } from '@/common/swagger/api-response.decorator';
import { AppService } from '@/bootstrap/app.service';
import { NestApp } from '@/bootstrap/nest-app';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	@ApiMessageResponse()
	getHello(): MessageEnvelope {
		const response = this.appService.getHello();

		return ResponseHelper.message(response);
	}

	@Get('/app/health-check')
	@ApiMessageResponse()
	healthCheck(): MessageEnvelope {
		const response = NestApp.getName() || 'api';

		return ResponseHelper.message(response);
	}
}
