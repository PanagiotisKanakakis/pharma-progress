import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from '../../common';
import { Like, Repository, UpdateResult } from 'typeorm';
import {
    afmToUsername,
    CreateUserDto,
    QueryUserDto,
    UpdateUserDto,
} from '../common';
import { User } from './user.entity';
import { KeycloakUsersService } from '../keycloak';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly keycloakUsersService: KeycloakUsersService,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<User> {
        const { id: keycloakId } =
            await this.keycloakUsersService.getOrCreateUserByAfm(createUserDto);
        let user = await this.findOneByAfm(createUserDto.afm);
        if (!user) {
            user = new User();
        }
        user.afm = createUserDto.afm;
        user.keycloakId = keycloakId;
        user.username = await afmToUsername(createUserDto.afm);
        user.email = createUserDto.email;
        user.firstName = createUserDto.firstName;
        user.lastName = createUserDto.lastName;
        return this.usersRepository.save(user);
    }

    update(id: number, dto: UpdateUserDto): Promise<UpdateResult> {
        const user = new User();
        user.firstName = dto.firstName;
        user.lastName = dto.lastName;
        return this.usersRepository.update({ id }, user);
    }

    async findAll(dto: QueryUserDto): Promise<PageDto<User>> {
        const query = {
            cache: true,
            take: dto.limit,
            skip: dto.page > 1 ? dto.limit * (dto.page - 1) : 0,
        };
        let where = {};

        if (dto.afm) {
            where = { ...where, ...{ afm: dto.afm } };
        }

        if (dto.username) {
            where = { ...where, ...{ username: dto.username } };
        }

        if (dto.keycloakId) {
            where = { ...where, ...{ keycloakId: dto.keycloakId } };
        }

        if (dto.firstName) {
            where = {
                ...where,
                ...{
                    firstName: Like(`%${dto.firstName}%`),
                },
            };
        }

        if (dto.lastName) {
            where = {
                ...where,
                ...{
                    lastName: Like(`%${dto.lastName}%`),
                },
            };
        }

        query['where'] = where;

        const [result, total] = await this.usersRepository.findAndCount(query);
        return new PageDto(
            result,
            total,
            Math.ceil(total / dto.limit),
            dto.page > 1 ? dto.page : 1,
        );
    }

    findOneOrFail(id: string): Promise<User> {
        return this.usersRepository.findOneOrFail(id);
    }

    findOneByUsernameOrFail(username: string): Promise<User> {
        return this.usersRepository.findOneOrFail({
            where: { username: username },
        });
    }

    findOneByKeycloakIdOrFail(keycloakId: string): Promise<User> {
        return this.usersRepository.findOneOrFail({
            where: { keycloakId: keycloakId },
        });
    }

    findOneByKeycloakId(keycloakId: string): Promise<User> {
        return this.usersRepository.findOne({
            where: { keycloakId: keycloakId },
        });
    }

    findOneByAfm(afm: string): Promise<User> {
        return this.usersRepository.findOne({
            where: { afm: afm },
        });
    }

    findOneByAfmOrFail(afm: string): Promise<User> {
        return this.usersRepository.findOneOrFail({
            where: { afm: afm },
        });
    }

    async remove(id: string): Promise<void> {
        await this.usersRepository.delete(id);
    }
}
