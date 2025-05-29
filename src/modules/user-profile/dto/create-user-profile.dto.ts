import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsEnum, IsArray, IsDateString, IsOptional } from 'class-validator';
import { UserGender } from 'src/common/types/enums/user-profile.enum';

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

    @ApiProperty({ type: [String], description: 'Hobbies of the user', example: ['reading', 'hiking'] })
    @IsNotEmpty()
    @Transform(({ value }) =>
        typeof value === 'string' ? value.split(',').map(v => v.trim()) : value
    )
    @IsArray()
    @IsString({ each: true })
    hobbies: string[];

    @ApiProperty({ description: 'Gender of the user', example: 'MALE', enum: UserGender })
    @IsNotEmpty()
    @IsEnum(UserGender)
    gender: UserGender;

    @ApiProperty({ description: 'Date of birth of the user', example: '1990-01-01' })
    @IsNotEmpty()
    @IsDateString()
    date_of_birth: string;

    @ApiProperty({
        description: 'Profile Picture (file upload)',
        required: false,
        type: 'string',
        format: 'binary',
    })
    @IsOptional()
    profile_picture?: Express.Multer.File;
}