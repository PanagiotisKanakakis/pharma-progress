import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthBrokerModule, User, UsersService } from '../authbroker';
import { Transaction } from './transaction.entity';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';

@Module({
    imports: [TypeOrmModule.forFeature([User, Transaction]), AuthBrokerModule],
    providers: [TransactionService, UsersService],
    controllers: [TransactionController],
    exports: [TransactionService],
})
export class TransactionModule {}
