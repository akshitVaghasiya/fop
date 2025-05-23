import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ItemInterestDto {
  @ApiProperty({
    description: 'UUID of the item',
  })
  @IsUUID()
  item_id: string;
}
