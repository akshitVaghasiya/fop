import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
    @ApiProperty({ description: 'Title of the role', example: 'Admin' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    title?: string;

    @ApiProperty({
        description: 'Array of permissions for the role',
        example: ['user_list', 'item_create'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    auth_items?: string[];
}