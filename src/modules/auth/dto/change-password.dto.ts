import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'OldPassword123!' })
    @IsString()
    @IsNotEmpty()
    oldPassword: string;

    @ApiProperty({ example: 'NewPassword123!' })
    @IsString()
    @IsNotEmpty()
    newPassword: string;
}