import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignReceiverDto {
  @ApiProperty({
    description: 'UUID of the receiver user',
  })
  @IsUUID()
  receiver_user_id: string;
}
