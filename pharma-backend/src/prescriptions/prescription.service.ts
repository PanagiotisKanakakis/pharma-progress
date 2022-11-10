import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { CreatePrescriptionDto } from './dto';
import { UserService } from '../authbroker/users';
import { Prescription } from './prescription.entity';
import { CriteriaDto } from '../statistics/dto';
import {getMonthRanges, getWeek, toDate} from '../common';
import { Check } from '../checks';
import { RangeType } from '../statistics/enums/range-type.enum';

@Injectable()
export class PrescriptionService {
    private readonly logger = new Logger(PrescriptionService.name);

    constructor(
        @InjectRepository(Prescription)
        private readonly prescriptionRepository: Repository<Prescription>,
        private readonly userService: UserService,
        @InjectConnection()
        private readonly connection: Connection,
    ) {}

    public async create(dto: CreatePrescriptionDto): Promise<any> {
        try {
            const prescription = new Prescription();
            prescription.user = await this.userService.findOneOrFail(
                dto.userId,
            );
            prescription.amount = dto.amount;
            prescription.createdAt = toDate(dto.createdAt);
            prescription.comment = dto.comment;
            await this.prescriptionRepository.save(prescription);
            return prescription;
        } catch (e) {
            this.logger.error('Commit prescription failed with error ' + e);
        }
    }

    public async update(id: string, dto: CreatePrescriptionDto): Promise<any> {
        try {
            delete dto.userId;
            await this.prescriptionRepository.update(id, dto);
        } catch (e) {
            this.logger.error('Commit prescription failed with error ' + e);
        }
    }

    public async getByUserId(userId): Promise<Prescription[]> {
        try {
            const user = await this.userService.findOneOrFail(userId);
            return user.prescriptions;
        } catch (e) {
            this.logger.error(
                'Failed to retrieve prescription for user with error  ' + e,
            );
        }
    }

    async getAllByCriteria(criteriaDto: CriteriaDto): Promise<Prescription[]> {
        const query = this.prescriptionRepository
            .createQueryBuilder('prescriptions')
            .where('prescriptions.userId = :userId ', {
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
