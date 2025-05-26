import { IsNumber, IsOptional, IsString, IsEnum, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ApprovePermissionRequestFilterDto {
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

    @ApiProperty({ example: 'PENDING', required: false, enum: ['PENDING', 'APPROVED', 'DENIED'] })
    @IsEnum(['PENDING', 'APPROVED', 'DENIED'])
    @IsOptional()
    status?: 'PENDING' | 'APPROVED' | 'DENIED';

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    item_id?: string;

    @ApiProperty({ description: 'Filter by owner UUID (for viewers)', required: false })
    @IsUUID()
    @IsOptional()
    owner_id?: string;
}