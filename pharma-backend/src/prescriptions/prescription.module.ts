import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from './prescription.entity';
import { PrescriptionController } from './prescription.controller';
import { PrescriptionService } from './prescription.service';
import { User, UserService } from '../authbroker/users';
import { AuthBrokerModule } from '../authbroker/authbroker.module';

@Module({
    imports: [TypeOrmModule.forFeature([User, Prescription]), AuthBrokerModule],
    providers: [PrescriptionService, UserService],
    controllers: [PrescriptionController],
    exports: [PrescriptionService],
})
export class PrescriptionModule {}
