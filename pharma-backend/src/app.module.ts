import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerOptions } from 'typeorm';
import { HealthModule } from './health';
import { APP_GUARD } from '@nestjs/core';
import { AuthBrokerModule, AuthGuard, ResourceOrRoleGuard } from './authbroker';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggingModule } from './logging';
import { FilesModule } from './files';
import { TransactionModule } from './transaction/transaction.module';

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
        // cron support
        ScheduleModule.forRoot(),
        // health endpoints
        HealthModule,
        // custom logger
        LoggingModule,
        // authentication
        AuthBrokerModule,
        FilesModule,
        TransactionModule,
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
