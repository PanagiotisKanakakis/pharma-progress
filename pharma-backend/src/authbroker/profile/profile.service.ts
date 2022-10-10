import { Logger, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateResult } from 'typeorm';
import {
    CreateUserDto,
    UpdateUserDto,
    UserInfoDto,
    UpdateUserInfoDto,
} from '../common';
import { KeycloakAdminService } from '../keycloak';
import { UserService, User } from '../users';

@Injectable()
export class ProfileService {
    private readonly logger = new Logger(ProfileService.name);

    constructor(
        private readonly usersService: UserService,
        private readonly keycloakAdminService: KeycloakAdminService,
    ) {}

    async getUserInfo(user: any): Promise<UserInfoDto> {
        let userEntity: User = await this.usersService.findOneByKeycloakId(
            user.sub,
        );
        if (!userEntity) {
            this.logger.log(
                `User ${user.sub} not found. Initiating local provisioning.`,
            );

            const userFromKeycloak = await this.keycloakAdminService.getUser(
                user.sub,
            );
            if (!userFromKeycloak) {
                this.logger.error(
                    `User from jwt token not found in keycloak! Please contact the administrators.`,
                );
                throw new NotFoundException();
            }

            const createUserDto: CreateUserDto = new CreateUserDto();
            createUserDto.afm = '1234';
            createUserDto.firstName = userFromKeycloak.firstName;
            createUserDto.lastName = userFromKeycloak.lastName;
            createUserDto.username = userFromKeycloak.username;
            createUserDto.email = userFromKeycloak.email;
            userEntity = await this.usersService.create(createUserDto);
            this.logger.log(
                `Created user ${userEntity.id} associated with ${user.sub}.`,
            );
        }
        this.logger.debug(userEntity.username);
        // build user info
        const userInfoDto = new UserInfoDto();
        userInfoDto.id = userEntity.id;
        userInfoDto.afm = userEntity.afm;
        userInfoDto.username = userEntity.username;
        userInfoDto.email = user.email;
        userInfoDto.firstName = userEntity.firstName;
        userInfoDto.lastName = userEntity.lastName;

        return userInfoDto;
    }

    async update(
        id: number,
        updateUserInfoDto: UpdateUserInfoDto,
    ): Promise<UpdateResult> {
        const updateUserDto = new UpdateUserDto();
        updateUserDto.firstName = updateUserInfoDto.firstName;
        updateUserDto.lastName = updateUserInfoDto.lastName;
        this.logger.log(
            'About to update User ' +
                id +
                ' with new firstName: ' +
                updateUserInfoDto.firstName +
                ' and new lastName: ' +
                updateUserInfoDto.lastName,
        );
        return this.usersService.update(id, updateUserDto);
    }
}
