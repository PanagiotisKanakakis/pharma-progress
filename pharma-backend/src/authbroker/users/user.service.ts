import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from '../../common';
import { Like, Repository, UpdateResult } from 'typeorm';
import { CreateUserDto, QueryUserDto, UpdateUserDto } from '../index';
import { User } from './user.entity';
import { KeycloakUsersService } from '../index';
import { OpeningBalance } from 'src/opening-balance/opening-balance.entity';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly keycloakUsersService: KeycloakUsersService,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<User> {
        const { id: keycloakId } =
            await this.keycloakUsersService.getOrCreateUserByAfm(createUserDto);
        let user = await this.findOneByUsername(createUserDto.username);

        if (!user) {
            user = new User();
        }
        user.afm = createUserDto.afm;
        user.keycloakId = keycloakId;
        user.username = createUserDto.username;
        user.email = createUserDto.email;
        user.firstName = createUserDto.firstName;
        user.lastName = createUserDto.lastName;

        const openingBalance = new OpeningBalance();
        openingBalance.value = createUserDto.openingBalance;
        user.openingBalances = [];
        user.openingBalances.push(openingBalance);
        user.businessType = createUserDto.businessType;
        return this.usersRepository.save(user);
    }

    update(username: string, dto: UpdateUserDto): Promise<UpdateResult> {
        return this.findOneByUsernameOrFail(username).then((user) => {
            const openingBalance = new OpeningBalance();
            openingBalance.value = dto.openingBalance;
            user.openingBalances.push(openingBalance);
            user.businessType = dto.businessType;
            return this.usersRepository.update({ username }, user);
        });
    }

    async getAllUserIds(): Promise<string[]> {
        return await this.usersRepository
            .createQueryBuilder('user')
            .select('user.id')
            .distinct(true)
            .getRawMany()
            .then((r) =>
                r.map((i) => {
                    return i['userId'];
                }),
            );
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

    findOneByUsername(username: string): Promise<User> {
        return this.usersRepository.findOne({
            where: { username: username },
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
