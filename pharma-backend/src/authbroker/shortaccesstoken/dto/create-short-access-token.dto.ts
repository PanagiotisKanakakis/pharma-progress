import { ApiProperty } from '@nestjs/swagger';
import { PermissionTypes, ResourceTypes } from '../../interfaces';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateShortAccessToken {
    @ApiProperty({ enum: ResourceTypes })
    @IsEnum(ResourceTypes)
    @IsNotEmpty()
    resourceType: ResourceTypes;

    @ApiProperty()
    @IsNotEmpty()
    resourceId: string;

    @ApiProperty({ enum: PermissionTypes })
    @IsEnum(PermissionTypes)
    @IsNotEmpty()
    permission: PermissionTypes;

    @ApiProperty()
    @IsOptional()
    duration: string;
}
