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
import { CreatePrescriptionDto } from './dto';
import { PrescriptionService } from './prescription.service';
import { CriteriaDto } from '../statistics/dto';
import { Prescription } from './prescription.entity';

@ApiTags('Prescription')
@Controller('api/prescription')
export class PrescriptionController {
    constructor(readonly service: PrescriptionService) {}

    private readonly logger = new Logger(PrescriptionController.name);

    @Post('')
    @ApiOkResponse({
        status: 201,
        description: 'Create prescription for a given userId',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async create(@Body() dto: CreatePrescriptionDto): Promise<any> {
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
        @Body() dto: CreatePrescriptionDto,
    ): Promise<any> {
        return await this.service.update(id, dto);
    }

    @Get('getAllByUserId/:userId')
    @ApiOkResponse({
        status: 201,
        description: 'Get prescription values for a given userId',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async getAllByUserId(@Param('userId') userId): Promise<any> {
        return this.service.getByUserId(userId);
    }

    @Get('getAllByCriteria')
    @ApiOkResponse({
        status: 201,
        description: 'Get prescription (s) for a given userId using criteria',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async getAllByCriteria(
        @Query() criteriaDto: CriteriaDto,
    ): Promise<Prescription[]> {
        return await this.service.getAllByCriteria(criteriaDto);
    }
}
