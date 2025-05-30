import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { ProfileViewStatus } from 'src/common/types/enums/profile-view-request.enum';

export class UpdateStatusProfileDto {
    @ApiProperty({ description: 'status of user profile view request', enum: ProfileViewStatus })
    @IsNotEmpty()
    @IsEnum(ProfileViewStatus)
    status: ProfileViewStatus;
}