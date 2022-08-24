import {Injectable, Logger, NotFoundException} from "@nestjs/common";
import {Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";
import {File} from "./file.entity";
import {QueryFileDto} from "./dto";
import {TypeOrmCrudService} from "@nestjsx/crud-typeorm";

@Injectable()
export class FilesService extends TypeOrmCrudService<File> {
    private readonly logger = new Logger(FilesService.name);
    private readonly filesRepository: Repository<File>;

    constructor(@InjectRepository(File) filesRepository: Repository<File>) {
        super(filesRepository);
        this.filesRepository = filesRepository
    }

    async upload(fileName, mimeType, buffer) {
        const dataBaseFile = new File();
        dataBaseFile.fileName = fileName;
        dataBaseFile.mimeType = mimeType;
        dataBaseFile.data = buffer;
        await this.filesRepository.save(dataBaseFile);
        return dataBaseFile.id;
    }

    async downloadFileById(queryFileDto: QueryFileDto) {
        const file = await this.filesRepository.findOne(queryFileDto.fileId);
        if (!file)
            throw new NotFoundException();
        return file;
    }

}
