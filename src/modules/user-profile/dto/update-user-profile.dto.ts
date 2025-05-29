import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsArray, IsEnum, IsDateString } from 'class-validator';
import { UserGender } from 'src/common/types/enums/user-profile.enum';

export class UpdateUserProfileDto {
    @ApiPropertyOptional({ description: 'Address of the user', example: '123 Main St, City' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: 'Mobile number of the user', example: '+1234567890' })
    @IsOptional()
    @IsString()
    mobile_number?: string;

    @ApiPropertyOptional({ description: 'Bio of the user', example: 'Avid traveler and tech enthusiast' })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiPropertyOptional({ description: 'Hobbies of the user', example: ['reading', 'hiking'] })
    @IsOptional()
    @Transform(({ value }) =>
        typeof value === 'string' ? value.split(',').map(v => v.trim()) : value
    )
    @IsArray()
    @IsString({ each: true })
    hobbies?: string[];

    @ApiPropertyOptional({ description: 'Gender of the user', example: 'MALE', enum: UserGender })
    @IsOptional()
    @IsEnum(UserGender)
    gender?: UserGender;

    @ApiPropertyOptional({ description: 'Date of birth of the user', example: '1990-01-01' })
    @IsOptional()
    @IsDateString()
    date_of_birth?: string;

    @ApiProperty({
        description: 'Profile Picture (file upload)',
        required: false,
        type: 'string',
        format: 'binary',
    })
    @IsOptional()
    profile_picture?: Express.Multer.File;
}
