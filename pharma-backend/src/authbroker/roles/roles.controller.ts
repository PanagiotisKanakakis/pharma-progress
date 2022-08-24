import RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import { Controller, Get } from '@nestjs/common';
import { RealmRole } from '../authbroker.constants';
import { RoleDto, UserInfoDto } from '../common';
import { KeycloakAdminService } from '../keycloak';
import {
    ApiBearerAuth,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Authn/Authz')
@Controller('api/auth/roles')
export class RolesController {
    constructor(private readonly keycloakAdminService: KeycloakAdminService) {}

    @Get()
    @ApiResponse({
        status: 200,
        description: 'Get user roles',
        type: UserInfoDto,
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async findAll(): Promise<RoleDto[]> {
        let result: RoleDto[] = [];
        for (const key of Object.keys(RealmRole)) {
            const roleRepresentation: RoleRepresentation =
                await this.keycloakAdminService.getRole(RealmRole[key]);
            const roleDto = new RoleDto();
            roleDto.id = roleRepresentation.id;
            roleDto.name = roleRepresentation.name;
            result.push(roleDto);
        }
        return result;
    }
}
