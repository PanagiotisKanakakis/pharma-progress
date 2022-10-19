import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { AuthenticatedUser, UserInfoDto, UpdateUserInfoDto } from '../common';
import { UpdateResult } from 'typeorm';
import { ProfileService } from './profile.service';
import {
    ApiBearerAuth,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('User Profile')
@Controller('api/auth/profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Get()
    @ApiResponse({
        status: 200,
        description: 'Get user profile information',
        type: UserInfoDto,
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async getUserInfo(@AuthenticatedUser() user: any): Promise<UserInfoDto> {
        return this.profileService.getUserInfo(user);
    }

    @Put(':username')
    @ApiResponse({
        status: 200,
        description: 'Update user profile',
        type: UpdateResult,
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBearerAuth()
    async updateUserInfo(
        @Param('username') username: string,
        @Body() updateUserInfoDto: UpdateUserInfoDto,
    ): Promise<UpdateResult> {
        return this.profileService.update(username, updateUserInfoDto);
    }
}
