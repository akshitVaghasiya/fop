import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
    @ApiProperty({
        description: 'The refresh token used to obtain a new access token',
    })
    @IsString()
    @IsNotEmpty()
    refresh_token: string;
}