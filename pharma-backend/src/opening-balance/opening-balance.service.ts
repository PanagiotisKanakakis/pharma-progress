import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { CreateOpeningBalanceDto } from './dto';
import { UserService } from '../authbroker/users';
import { InjectQueue, Process } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { CronExpression } from '@nestjs/schedule';
import { OpeningBalance } from './opening-balance.entity';
import { StatisticsService } from '../statistics/statistics.service';
import { CriteriaDto } from '../statistics/dto';
import { parseDate } from '../common';

@Injectable()
export class OpeningBalanceService {
    private readonly logger = new Logger(OpeningBalanceService.name);

    constructor(
        @InjectRepository(OpeningBalance)
        private readonly openingBalanceRepository: Repository<OpeningBalance>,
        private readonly userService: UserService,
        private readonly statisticsService: StatisticsService,
        private readonly configService: ConfigService,
        @InjectQueue('opening-balance-queue')
        private readonly openingBalanceQueue: Queue,
        @InjectConnection()
        private readonly connection: Connection,
    ) {
        const cronSchedule = this.configService.get(
            'PHARMA_TRANSACTION_GENERATION_CRONJOB',
            CronExpression.EVERY_MINUTE,
        );

        this.openingBalanceQueue.add(
            'daily-opening-balance-creation-job',
            {
                description: 'Set the daily opening balance',
            },
            {
                repeat: { cron: cronSchedule },
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }

    /**
     * Start job of daily opening balance creation
     */
    @Process('daily-opening-balance-creation')
    async dailyOpeningBalanceCreation(job: Job<unknown> | undefined) {
        this.logger.log(
            `Scheduled daily opening balance creation job started!`,
        );
        const today = parseDate(new Date().toLocaleDateString());
        const criteria = new CriteriaDto();
        const dateFrom = today;
        const dateTo = today;
        const userIds = await this.userService.getAllUserIds();
        for (const userId in userIds) {
            const openingBalance = new OpeningBalance();
            openingBalance.user = await this.userService.findOneOrFail(userId);
            openingBalance.value = String(
                +(await this.statisticsService.getTotalIncome(
                    criteria,
                    dateFrom,
                    dateTo,
                )) -
                    +(await this.statisticsService.getTotalCashPurchases(
                        criteria,
                        dateFrom,
                        dateTo,
                    )) -
                    +(await this.statisticsService.getTotalOperatingExpenses(
                        criteria,
                        dateFrom,
                        dateTo,
                    )),
            );
            try {
                await this.openingBalanceRepository.save(openingBalance);
            } catch (e) {
                this.logger.error(
                    'Commit opening balance failed with error ' + e,
                );
            }
        }
    }

    public async create(dto: CreateOpeningBalanceDto): Promise<any> {
        try {
            const openingBalance = new OpeningBalance();
            openingBalance.user = await this.userService.findOneOrFail(
                dto.userId,
            );
            openingBalance.value = dto.cost;
            await this.openingBalanceRepository.save(openingBalance);
        } catch (e) {
            this.logger.error('Commit opening balance failed with error ' + e);
        }
    }

    public async update(
        id: string,
        dto: CreateOpeningBalanceDto,
    ): Promise<any> {
        try {
            await this.openingBalanceRepository.update(id, {
                value: dto.cost,
            });
        } catch (e) {
            this.logger.error('Commit opening balance failed with error ' + e);
        }
    }

    public async getByUserId(userId): Promise<OpeningBalance[]> {
        try {
            const user = await this.userService.findOneOrFail(userId);
            return user.openingBalances;
        } catch (e) {
            this.logger.error(
                'Failed to retrieve opening balances for user with error  ' + e,
            );
        }
    }
}
