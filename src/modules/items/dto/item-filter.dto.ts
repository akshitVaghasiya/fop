import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemStatus, ItemType } from 'src/common/types/enums/items.enum';

export class ItemFilterDto {
  @ApiPropertyOptional({ enum: ItemType, description: 'Filter items by type' })
  @IsEnum(ItemType)
  @IsOptional()
  type?: ItemType;

  @ApiPropertyOptional({
    enum: ItemStatus,
    description: 'Filter items by status',
  })
  @IsEnum(ItemStatus)
  @IsOptional()
  status?: ItemStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1, example: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    example: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 5;

  @ApiPropertyOptional({ description: 'Search term for items', example: '' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    default: 'created_at',
  })
  @IsString()
  @IsOptional()
  sort_by?: string;

  @ApiPropertyOptional({
    description: 'Sort order (ASC or DESC)',
    default: 'DESC',
  })
  @IsString()
  @IsOptional()
  sort_type?: 'ASC' | 'DESC';
}
