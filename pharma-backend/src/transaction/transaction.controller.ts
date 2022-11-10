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
import { CreateTransactionDto } from './dto';
import { TransactionService } from './transaction.service';
import { CriteriaDto } from '../statistics/dto';
import { Transaction } from './transaction.entity';

@ApiTags('Transactions')
@Controller('api/transaction')
export class TransactionController {
    constructor(readonly service: TransactionService) {}

    private readonly logger = new Logger(TransactionController.name);

    @Get('getAllTransactionsByCriteria')
    @ApiOkResponse({
        status: 201,
        description: 'Get transaction (s) for a given userId using criteria',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async getAllTransactionsByCriteria(
        @Query() criteriaDto: CriteriaDto,
    ): Promise<Transaction[]> {
        return await this.service.getAllTransactionsByCriteria(criteriaDto);
    }

    @Post('')
    @ApiOkResponse({
        status: 201,
        description: 'Commit transaction (s) for a given userId',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async commit(@Body() dto: CreateTransactionDto): Promise<any> {
        return await this.service.commit(dto);
    }

    @Put('/:id')
    @ApiOkResponse({
        status: 201,
        description: 'Update transaction (s) for a given userId',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async update(@Param('id') id, @Body() dto: CreateTransactionDto): Promise<any> {
        return await this.service.update(id, dto);
    }

    @Get('getAllByUserId/:userId')
    @ApiOkResponse({
        status: 201,
        description: 'Get transaction (s) for a given userId',
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async getAllByAfm(@Param('userId') userId): Promise<any> {
        return [];
    }
}
