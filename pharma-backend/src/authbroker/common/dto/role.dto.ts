import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;
}
