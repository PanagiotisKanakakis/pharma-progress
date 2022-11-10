import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { CreatePrescriptionDto } from './dto';
import { UserService } from '../authbroker/users';
import { InjectQueue, Process } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { CronExpression } from '@nestjs/schedule';
import { Prescription } from './prescription.entity';
import { StatisticsService } from '../statistics/statistics.service';
import { CriteriaDto } from '../statistics/dto';
import { parseDate } from '../common';

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
            await this.prescriptionRepository.save(prescription);
        } catch (e) {
            this.logger.error('Commit prescription failed with error ' + e);
        }
    }

    public async update(id: string, dto: CreatePrescriptionDto): Promise<any> {
        try {
            await this.prescriptionRepository.update(id, {
                amount: dto.amount,
            });
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
}
