import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Check } from './check.entity';
import { CheckController } from './check.controller';
import { CheckService } from './check.service';
import { User, UserService } from '../authbroker/users';
import { AuthBrokerModule } from '../authbroker/authbroker.module';

@Module({
    imports: [TypeOrmModule.forFeature([User, Check]), AuthBrokerModule],
    providers: [CheckService, UserService],
    controllers: [CheckController],
    exports: [CheckService],
})
export class CheckModule {}
