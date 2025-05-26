import { IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionRequestDto {
    @ApiProperty({ example: 'UUID of the item (optional if item_interest_id or chat_id provided)', required: false })
    @IsUUID()
    @IsOptional()
    item_id?: string;

    @ApiProperty({ example: 'UUID of the profile owner (optional, derived from item or chat)', required: false })
    @IsUUID()
    @IsOptional()
    owner_id?: string;

    // @ApiProperty({ example: 'UUID of the requester (optional, derived from auth)', required: false })
    // @IsUUID()
    // @IsOptional()
    // requester_id?: string;

    @ApiProperty({ example: 'UUID of the item interest (for FOUND/FREE)', required: false })
    @IsUUID()
    @IsOptional()
    item_interest_id?: string;

    @ApiProperty({ example: 'UUID of the chat message (for LOST)', required: false })
    @IsUUID()
    @IsOptional()
    chat_id?: string;
}