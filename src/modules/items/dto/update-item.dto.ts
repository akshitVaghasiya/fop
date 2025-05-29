import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
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
    description: 'Location where the item was found or lost',
    required: false,
    example: 'New York City',
  })
  @IsString()
  @IsOptional()
  location?: string;

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