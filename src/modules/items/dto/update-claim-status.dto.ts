import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum ClaimStatus {
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export class UpdateClaimStatusDto {
    @ApiProperty({ description: 'Status of the claim', example: 'APPROVED', enum: ClaimStatus })
    @IsNotEmpty()
    @IsEnum(ClaimStatus)
    status: ClaimStatus;
}