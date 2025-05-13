import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'Active status of the user', example: true })
  @IsBoolean()
  is_active: boolean;
}
