import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Transaction } from '../transaction';
import { TransactionModule } from '../transaction/transaction.module';
import { TransactionService } from '../transaction/transaction.service';
import { User, UserService } from '../authbroker/users';
import { AuthBrokerModule } from '../authbroker/authbroker.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Transaction, User]),
        AuthBrokerModule,
        TransactionModule,
    ],
    providers: [StatisticsService, TransactionService, UserService],
    controllers: [StatisticsController],
    exports: [StatisticsService],
})
export class StatisticsModule {}
