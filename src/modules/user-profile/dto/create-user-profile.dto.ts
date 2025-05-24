import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsArray, IsDateString } from 'class-validator';
import { Gender } from 'src/common/models/users.model';

export class CreateUserProfileDto {
    @ApiProperty({ description: 'Address of the user', example: '123 Main St, City' })
    @IsNotEmpty()
    @IsString()
    address: string;

    @ApiProperty({ description: 'Mobile number of the user', example: '+1234567890' })
    @IsNotEmpty()
    @IsString()
    mobile_number: string;

    @ApiProperty({ description: 'Bio of the user', example: 'Avid traveler and tech enthusiast' })
    @IsNotEmpty()
    @IsString()
    bio: string;

    @ApiProperty({ description: 'Hobbies of the user', example: ['reading', 'hiking'] })
    @IsNotEmpty()
    @IsArray()
    @IsString({ each: true })
    hobbies: string[];

    @ApiProperty({ description: 'Gender of the user', example: 'MALE', enum: Gender })
    @IsNotEmpty()
    @IsEnum(Gender)
    gender: Gender;

    @ApiProperty({ description: 'Date of birth of the user', example: '1990-01-01' })
    @IsNotEmpty()
    @IsDateString()
    date_of_birth: string;
}