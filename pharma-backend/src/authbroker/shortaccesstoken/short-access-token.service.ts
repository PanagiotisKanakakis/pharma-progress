import { Logger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from '../../common';
import { FindManyOptions, Repository } from 'typeorm';
import { ShortAccessTokenEntity } from './short-access-token.entity';
import { CreateShortAccessToken, ShortAccessTokenQueryDto } from './dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ShortAccessTokenService {
    private readonly logger = new Logger(ShortAccessTokenService.name);

    constructor(
        @InjectRepository(ShortAccessTokenEntity)
        private readonly shortAccessTokenRepository: Repository<ShortAccessTokenEntity>,
        private readonly configService: ConfigService,
    ) {}

    async create(
        shortaccesstokenDto: CreateShortAccessToken,
    ): Promise<ShortAccessTokenEntity> {
        let SAT = new ShortAccessTokenEntity();
        SAT.permission = shortaccesstokenDto.permission;
        SAT.duration = shortaccesstokenDto.duration
            ? shortaccesstokenDto.duration
            : this.configService.get('PHARMA_SHORTACCESSTOKEN_DEFAULT_DURATION');
        SAT.resourceType = shortaccesstokenDto.resourceType;
        SAT.resourceId = shortaccesstokenDto.resourceId;
        SAT = await this.shortAccessTokenRepository.save(SAT);
        return SAT;
    }

    async findAll(
        dto: ShortAccessTokenQueryDto,
    ): Promise<PageDto<ShortAccessTokenEntity>> {
        const query: FindManyOptions<ShortAccessTokenEntity> = {
            take: dto.limit,
            skip: dto.page > 1 ? dto.limit * (dto.page - 1) : 0,
        };

        if (dto.token) {
            query['where'] = {
                token: dto.token,
            };
        }

        const [result, total] =
            await this.shortAccessTokenRepository.findAndCount(query);
        return new PageDto(
            result,
            total,
            Math.ceil(total / 25),
            dto.page > 1 ? dto.page : 1,
        );
    }

    findOne(id: string): Promise<ShortAccessTokenEntity> {
        return this.shortAccessTokenRepository.findOne(id);
    }

    findOneByToken(token: string): Promise<ShortAccessTokenEntity> {
        return this.shortAccessTokenRepository.findOne({
            where: { token: token },
        });
    }

    findOneByTokenAndResourceType(
        token: string,
        resourceType: string,
    ): Promise<ShortAccessTokenEntity> {
        return this.shortAccessTokenRepository.findOne({
            where: { token: token, resourceType: resourceType },
        });
    }

    findOneOrFail(id: string): Promise<ShortAccessTokenEntity> {
        return this.shortAccessTokenRepository.findOneOrFail(id);
    }

    async remove(id: string): Promise<void> {
        await this.shortAccessTokenRepository.delete(id);
    }
}
