import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';

@Module({
    imports: [
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
                synchronize: false,
                /*
                 * Important: Use different connection here, to not interfere
                 * with hot-reload.
                 */
                name: 'health', 
                keepConnectionAlive: configService.get<boolean>(
                    'PHARMA_POSTGRES_KEEP_CONN_ALIVE',
                ),
            }),
        }),
        TerminusModule,
    ],
    controllers: [HealthController],
})
export class HealthModule {}
