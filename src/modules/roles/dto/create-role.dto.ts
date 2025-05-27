import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'Title of the role', example: 'Admin' })
  @IsString()
  @IsNotEmpty()
  name: string;
}