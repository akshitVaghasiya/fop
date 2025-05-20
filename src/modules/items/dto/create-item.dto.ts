import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ItemType } from 'src/common/types/enums/items.enum';

export class CreateItemDto {
  @ApiProperty({
    enum: ItemType,
    description: 'Type of the item',
    example: ItemType.FREE,
  })
  @IsEnum(ItemType)
  type: ItemType;

  @ApiProperty({ description: 'Title of the item', example: 'Lost Wallet' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Description of the item',
    example: 'Black leather wallet with cards',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Location where the item was found or lost',
    required: false,
    example: 'New York City',
  })
  @IsString()
  @IsOptional()
  location?: string;

  // @ApiProperty({ description: 'URL of the item image', required: false, example: 'https://example.com/image.jpg' })
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
  itemImage: Express.Multer.File;
}
