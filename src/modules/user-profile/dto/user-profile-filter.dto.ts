import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UserProfileFilterDto {
    @ApiPropertyOptional({ description: 'Page number', default: 1, example: 1 })
    @IsNumber()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Number of items per page', default: 5, example: 5 })
    @IsNumber()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    limit?: number = 5;

    @ApiPropertyOptional({ description: 'Search term for address or bio', example: 'traveler' })
    @IsString()
    @IsOptional()
    search?: string;
}