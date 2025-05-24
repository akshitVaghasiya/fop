import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ChatFilterDto {
    @ApiProperty({ example: 1, required: false })
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiProperty({ example: 10, required: false })
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    limit?: number = 5;
}