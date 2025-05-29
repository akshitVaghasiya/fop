import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateItemInterestDto {
    @ApiProperty({ example: 'UUID of the item' })
    @IsUUID()
    @IsNotEmpty()
    item_id: string;

    // @ApiProperty({ example: true, required: false })
    // @IsBoolean()
    // @IsOptional()
    // requestProfileView?: boolean;
}