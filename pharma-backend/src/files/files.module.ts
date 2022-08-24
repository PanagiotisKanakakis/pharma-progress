import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthBrokerModule } from '../authbroker';
import { File } from './file.entity';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';

@Module({
    imports: [TypeOrmModule.forFeature([File]), AuthBrokerModule],
    providers: [FilesService],
    controllers: [FilesController],
    exports: [FilesService],
})
export class FilesModule {}
