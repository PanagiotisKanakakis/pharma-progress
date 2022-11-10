import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { CreateCheckDto } from './dto';
import { UserService } from '../authbroker/users';
import { Check } from './check.entity';
import { CriteriaDto } from '../statistics/dto';
import { RangeType } from '../statistics/enums/range-type.enum';
import { getMonthRanges, getWeek, toDate } from '../common';

@Injectable()
export class CheckService {
    private readonly logger = new Logger(CheckService.name);

    constructor(
        @InjectRepository(Check)
        private readonly checkRepository: Repository<Check>,
        private readonly userService: UserService,
        @InjectConnection()
        private readonly connection: Connection,
    ) {}

    public async create(dto: CreateCheckDto): Promise<any> {
        try {
            const check = new Check();
            check.user = await this.userService.findOneOrFail(dto.userId);
            check.purchasedAt = toDate(dto.purchasedAt);
            check.expiredAt = toDate(dto.expiredAt);
            check.comment = dto.comment;
            check.company = dto.company;
            check.cost = dto.cost;
            await this.checkRepository.save(check);
            return check;
        } catch (e) {
            this.logger.error('Commit prescription failed with error ' + e);
        }
    }

    public async update(id: string, dto: CreateCheckDto): Promise<any> {
        try {
            delete dto.userId;
            await this.checkRepository.update(id, dto);
        } catch (e) {
            this.logger.error('Commit check failed with error ' + e);
        }
    }

    public async getByUserId(userId): Promise<Check[]> {
        try {
            const user = await this.userService.findOneOrFail(userId);
            return user.checks;
        } catch (e) {
            this.logger.error(
                'Failed to retrieve prescription for user with error  ' + e,
            );
        }
    }

    async getAllByCriteria(criteriaDto: CriteriaDto): Promise<Check[]> {
        const query = this.checkRepository
            .createQueryBuilder('check')
            .where('check.userId = :userId ', {
                userId: criteriaDto.userId,
            });
        let dateRange;
        if (criteriaDto.range == RangeType.WEEKLY) {
            dateRange = getWeek(new Date(criteriaDto.date));
            query
                .andWhere('CAST ("createdAt" AS DATE) >= :dateFrom ', {
                    dateFrom: dateRange.dateFrom,
                })
                .andWhere('CAST ("createdAt" AS DATE) <= :dateTo ', {
                    dateTo: dateRange.dateTo,
                });
        } else if (criteriaDto.range == RangeType.MONTHLY) {
            dateRange = getMonthRanges(criteriaDto.range, criteriaDto.date);
            query
                .andWhere('CAST ("createdAt" AS DATE) >= :dateFrom ', {
                    dateFrom: dateRange[0].dateFrom,
                })
                .andWhere('CAST ("createdAt" AS DATE) <= :dateTo ', {
                    dateTo: dateRange[0].dateTo,
                });
        } else if (criteriaDto.range == RangeType.DAILY) {
            query.andWhere('CAST ("createdAt" AS DATE) = :dateFrom ', {
                dateFrom: criteriaDto.date,
            });
        }
        return query.getMany();
    }
}
