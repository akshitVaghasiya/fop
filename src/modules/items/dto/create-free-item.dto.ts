import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsNotEmpty, IsNumber, ArrayMinSize, ArrayMaxSize, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isValidCoordinates', async: false })
export class IsValidCoordinatesConstraint implements ValidatorConstraintInterface {
  validate(value: [number, number], args: ValidationArguments) {
    if (!Array.isArray(value) || value.length !== 2) {
      return false;
    }
    const [lon, lat] = value;
    if (isNaN(lon) || isNaN(lat)) {
      return false;
    }
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Coordinates must be valid numbers with longitude between -180 and 180, and latitude between -90 and 90';
  }
}

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
    description: 'Geographic coordinates as [longitude, latitude] or "longitude,latitude" string',
    example: [2.2945, 48.8584],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
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
  @Validate(IsValidCoordinatesConstraint)
  location?: [number, number] | string | null;


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
