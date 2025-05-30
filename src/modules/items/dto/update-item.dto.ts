import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsEnum, IsString, IsNumber, ArrayMinSize, ArrayMaxSize, Validate } from 'class-validator';
import { ItemStatus, ItemType } from 'src/common/types/enums/items.enum';

export class UpdateItemDto {
  @ApiProperty({
    enum: ItemType,
    description: 'Type of the item',
    required: false,
  })
  @IsEnum(ItemType)
  @IsOptional()
  type?: ItemType;

  @ApiProperty({
    description: 'Title of the item',
    required: false,
    example: 'Lost Wallet',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Description of the item',
    required: false,
    example: 'Black leather wallet with cards',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Geographic coordinates as [longitude, latitude] or "longitude,latitude" string',
    example: [2.2945, 48.8584],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        const [lon, lat] = value.split(',').map(Number);
        return [lon, lat];
      }
    }
    return value;
  })
  @IsNumber({}, { each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @Validate((value: [number, number]) => {
    const [lon, lat] = value;
    if (isNaN(lon) || isNaN(lat)) {
      throw new Error('Coordinates must be valid numbers');
    }
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      throw new Error('Invalid longitude or latitude values');
    }
    return true;
  })
  location?: [number, number];

  // @ApiProperty({
  //   description: 'URL of the item image',
  //   required: false,
  //   example: 'https://example.com/image.jpg',
  // })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiProperty({
    description: 'Image of the item (file upload)',
    required: false,
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  itemImage?: Express.Multer.File;

  @ApiProperty({
    enum: ItemStatus,
    description: 'Status of the item',
    required: false,
  })
  @IsEnum(ItemStatus)
  @IsOptional()
  status?: ItemStatus;
}