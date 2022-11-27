import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Transaction } from '../transaction';
import { TransactionModule } from '../transaction/transaction.module';
import { TransactionService } from '../transaction/transaction.service';
import { User, UserService } from '../authbroker/users';
import { AuthBrokerModule } from '../authbroker/authbroker.module';
import { PrescriptionModule } from '../prescriptions/prescription.module';
import { PrescriptionService } from '../prescriptions/prescription.service';
import { Prescription } from '../prescriptions';

@Module({
    imports: [
        TypeOrmModule.forFeature([Transaction, Prescription, User]),
        AuthBrokerModule,
        TransactionModule,
        PrescriptionModule,
    ],
    providers: [
        StatisticsService,
        TransactionService,
        UserService,
        PrescriptionService,
    ],
    controllers: [StatisticsController],
    exports: [StatisticsService],
})
export class StatisticsModule {}
