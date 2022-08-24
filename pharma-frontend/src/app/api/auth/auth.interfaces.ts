// import { AbstractCrudPageDto, AbstractEntity } from '@common/interfaces';
import { ResourceRole } from './auth.enums';

export interface UserInfo /*extends AbstractEntity*/ {
    afm: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface User /*extends AbstractEntity*/ {
    afm: string;
    username: string;
    firstName: string;
    lastName: string;
}

export interface UserWithRole {
    user: User;
    kedKepResourceRole: ResourceRole;
    localKepResourceRole: ResourceRole;
    kepResourceRole: ResourceRole;
}

// export interface UserWithRolePageDTO extends AbstractCrudPageDto {
//     data: Array<UserWithRole>;
// }
