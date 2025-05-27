import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsEnum, IsDateString } from 'class-validator';
import { Gender } from 'src/common/models/users.model';

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
    @IsArray()
    @IsString({ each: true })
    hobbies?: string[];

    @ApiPropertyOptional({ description: 'Gender of the user', example: 'MALE', enum: Gender })
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @ApiPropertyOptional({ description: 'Date of birth of the user', example: '1990-01-01' })
    @IsOptional()
    @IsDateString()
    date_of_birth?: string;
}
