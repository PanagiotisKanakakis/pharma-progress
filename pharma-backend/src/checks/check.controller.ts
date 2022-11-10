import {
    ApiBearerAuth,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
    Body,
    Controller,
    Get,
    Logger,
    Param,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { CreateCheckDto } from './dto';
import { CheckService } from './check.service';
import { CriteriaDto } from '../statistics/dto';
import { Check } from './check.entity';

@ApiTags('Checks')
@Controller('api/checks')
export class CheckController {
    constructor(readonly service: CheckService) {}

    private readonly logger = new Logger(CheckController.name);

    @Post('')
    @ApiOkResponse({
        status: 201,
        description: 'Create check for a given userId',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async create(@Body() dto: CreateCheckDto): Promise<any> {
        return await this.service.create(dto);
    }

    @Put('/:id')
    @ApiOkResponse({
        status: 201,
        description: 'Update check (s) for a given userId',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async update(@Param('id') id, @Body() dto: CreateCheckDto): Promise<any> {
        return await this.service.update(id, dto);
    }

    @Get('getAllByUserId/:userId')
    @ApiOkResponse({
        status: 201,
        description: 'Get opening balance values for a given userId',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async getAllByUserId(@Param('userId') userId): Promise<any> {
        return this.service.getByUserId(userId);
    }

    @Get('getAllByCriteria')
    @ApiOkResponse({
        status: 201,
        description: 'Get check (s) for a given userId using criteria',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async getAllByCriteria(
        @Query() criteriaDto: CriteriaDto,
    ): Promise<Check[]> {
        return await this.service.getAllByCriteria(criteriaDto);
    }
}
