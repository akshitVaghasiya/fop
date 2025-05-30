import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatDto {
    @ApiProperty({ example: 'Claim UUID (for FOUND items)', required: false })
    @IsUUID()
    @IsOptional()
    item_interest_id?: string;

    @ApiProperty({ example: 'Receiver UUID' })
    @IsUUID()
    @IsNotEmpty()
    receiver_id: string;

    @ApiProperty({ example: 'Can you describe the item?' })
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiProperty({ example: true, required: false })
    @IsBoolean()
    @IsOptional()
    requestProfileView?: boolean;
}