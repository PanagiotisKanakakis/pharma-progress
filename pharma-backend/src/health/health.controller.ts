import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
    HealthCheck,
    HealthCheckService,
    TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../authbroker';

@ApiTags('Health')
@Controller({
    path: 'api/health',
    version: VERSION_NEUTRAL,
})
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: TypeOrmHealthIndicator,
    ) {}

    @Get()
    @Public()
    @HealthCheck()
    check() {
        return this.health.check([async () => this.db.pingCheck('typeorm')]);
    }
}
