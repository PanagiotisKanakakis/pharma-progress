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
} from '@nestjs/common';
import { CreateOpeningBalanceDto } from './dto';
import { OpeningBalanceService } from './opening-balance.service';

@ApiTags('Opening Balance')
@Controller('api/opening-balance')
export class OpeningBalanceController {
    constructor(readonly service: OpeningBalanceService) {}

    private readonly logger = new Logger(OpeningBalanceController.name);

    @Post('')
    @ApiOkResponse({
        status: 201,
        description: 'Create opening balance for a given userId',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async create(@Body() dto: CreateOpeningBalanceDto): Promise<any> {
        return await this.service.create(dto);
    }

    @Put('/:id')
    @ApiOkResponse({
        status: 201,
        description: 'Update transaction (s) for a given userId',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async update(
        @Param('id') id,
        @Body() dto: CreateOpeningBalanceDto,
    ): Promise<any> {
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
}
