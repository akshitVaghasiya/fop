import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateFreeItemDto {
  @ApiProperty({ description: 'Title of the item', example: 'Free Wallet' })
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
    description: 'Location from where item picked up',
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
