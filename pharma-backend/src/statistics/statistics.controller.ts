import {
    ApiBearerAuth,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Controller, Get, Logger, Query } from '@nestjs/common';
import { CriteriaDto, StatisticsDto } from './dto';
import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@Controller('api/statistics')
export class StatisticsController {
    constructor(readonly service: StatisticsService) {}

    private readonly logger = new Logger(StatisticsController.name);

    @Get('')
    @ApiOkResponse({
        status: 201,
        description: 'Get transactions statistics',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async getStatisticsByCriteria(
        @Query() criteriaDto: CriteriaDto,
    ): Promise<StatisticsDto> {
        return this.service.getStatisticsByCriteria(criteriaDto);
    }
}
