import { IsNumber, IsOptional, IsString, IsEnum, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProfileViewStatus } from 'src/common/types/enums/profile-view-request.enum';

export class PermissionRequestFilterDto {
    @ApiProperty({ example: 1, required: false })
    @IsNumber()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @ApiProperty({ example: 10, required: false })
    @IsNumber()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;

    @ApiProperty({ example: 'PENDING', required: false, enum: ProfileViewStatus })
    @IsOptional()
    status?: ProfileViewStatus;

    @ApiProperty({ example: 'UUID of the item', required: false })
    @IsString()
    @IsOptional()
    item_id?: string;
}