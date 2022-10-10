import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { OpeningBalance } from './opening-balance.entity';
import { OpeningBalanceController } from './opening-balance.controller';
import { OpeningBalanceService } from './opening-balance.service';
import { User, UserService } from '../authbroker/users';
import { AuthBrokerModule } from '../authbroker/authbroker.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, OpeningBalance]),
        BullModule.registerQueue({
            name: 'opening-balance-queue',
        }),
        AuthBrokerModule,
    ],
    providers: [OpeningBalanceService, UserService],
    controllers: [OpeningBalanceController],
    exports: [OpeningBalanceService],
})
export class OpeningBalanceModule {}
