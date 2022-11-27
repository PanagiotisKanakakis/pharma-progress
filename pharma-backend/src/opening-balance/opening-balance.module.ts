import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { OpeningBalance } from './opening-balance.entity';
import { OpeningBalanceController } from './opening-balance.controller';
import { OpeningBalanceService } from './opening-balance.service';
import { User, UserService } from '../authbroker/users';
import { AuthBrokerModule } from '../authbroker/authbroker.module';
import { StatisticsService } from '../statistics/statistics.service';
import { StatisticsModule } from '../statistics/statistics.module';
import { Transaction } from '../transaction';
import { TransactionService } from '../transaction/transaction.service';
import { PrescriptionModule } from '../prescriptions/prescription.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, OpeningBalance, Transaction]),
        BullModule.registerQueue({
            name: 'opening-balance-queue',
        }),
        AuthBrokerModule,
        StatisticsModule,
        PrescriptionModule,
    ],
    providers: [
        OpeningBalanceService,
        UserService,
        StatisticsService,
        TransactionService,
    ],
    controllers: [OpeningBalanceController],
    exports: [OpeningBalanceService],
})
export class OpeningBalanceModule {}
