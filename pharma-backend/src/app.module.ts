import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerOptions } from 'typeorm';
import { HealthModule } from './health';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, ResourceOrRoleGuard } from './authbroker';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggingModule } from './logging';
import { BullModule } from '@nestjs/bull';
import { OpeningBalanceModule } from './opening-balance/opening-balance.module';
import { AuthBrokerModule } from './authbroker/authbroker.module';
import { TransactionModule } from './transaction/transaction.module';
import {StatisticsModule} from './statistics/statistics.module';
import {CheckModule} from './checks/check.module';
import {PrescriptionModule} from './prescriptions/prescription.module';

@Module({
    imports: [
        // config
        ConfigModule.forRoot({
            ignoreEnvFile: true,
            isGlobal: true,
        }),
        // database
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('PHARMA_POSTGRES_HOST'),
                port: +configService.get<number>('PHARMA_POSTGRES_PORT'),
                username: configService.get('PHARMA_POSTGRES_USER'),
                password: configService.get('PHARMA_POSTGRES_PASSWORD'),
                database: configService.get('PHARMA_POSTGRES_DB'),
                autoLoadEntities: true,
                cache: {
                    type: configService.get('PHARMA_TYPEORM_CACHE_TYPE'),
                    options: {
                        host: configService.get('PHARMA_TYPEORM_REDIS_HOST'),
                        port: configService.get<number>(
                            'PHARMA_TYPEORM_REDIS_PORT',
                        ),
                    },
                    duration: configService.get<number>(
                        'PHARMA_TYPEORM_CACHE_KEEP_DURATION',
                    ),
                },
                synchronize: false,
                migrationsRun: false,
                keepConnectionAlive: configService.get<boolean>(
                    'PHARMA_POSTGRES_KEEP_CONN_ALIVE',
                ),
                logging: <LoggerOptions>(
                    configService
                        .get<string>('PHARMA_TYPEORM_LOGGING')
                        .split(',')
                ),
            }),
        }),
        // bull jobs
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                redis: {
                    host: configService.get('PHARMA_QUEUES_BULL_REDIS_HOST'),
                    port: +configService.get('PHARMA_QUEUES_BULL_REDIS_PORT'),
                    db: +configService.get('PHARMA_QUEUES_BULL_REDIS_DB_INDEX'),
                    username: configService.get(
                        'PHARMA_QUEUES_BULL_REDIS_USER',
                    ),
                    password: configService.get(
                        'PHARMA_QUEUES_BULL_REDIS_PASSWORD',
                    ),
                },
            }),
            inject: [ConfigService],
        }),
        // cron support
        ScheduleModule.forRoot(),
        // health endpoints
        HealthModule,
        // custom logger
        LoggingModule,
        AuthBrokerModule,
        TransactionModule,
        OpeningBalanceModule,
        StatisticsModule,
        CheckModule,
        PrescriptionModule
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ResourceOrRoleGuard,
        },
    ],
})
export class AppModule {}
