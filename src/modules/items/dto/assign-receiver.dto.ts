import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignReceiverDto {
  @ApiProperty({
    description: 'UUID of the receiver user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  receiver_user_id: string;
}
