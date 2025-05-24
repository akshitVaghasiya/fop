import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignInterestDto {
    @ApiProperty({ enum: ['REJECTED', 'COMPLETED'], example: 'COMPLETED', required: false })
    @IsEnum(['REJECTED', 'COMPLETED'])
    @IsOptional()
    item_status?: string;
}