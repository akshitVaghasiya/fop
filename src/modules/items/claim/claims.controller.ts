import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    Req,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ClaimsService } from './claims.service';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { AssignReceiverDto } from '../dto/assign-receiver.dto';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';
import { ItemClaim } from 'src/common/models/item-claims.model';
import { UserRole } from 'src/common/models/users.model';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { CreateClaimDto } from '../dto/create-claim.dto';
import { ClaimFilterDto } from '../dto/claim-filter.dto';

@ApiTags('Claims')
@ApiBearerAuth()
@Controller('claims')
export class ClaimsController {
    constructor(private readonly claimsService: ClaimsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Create a claim for a found item' })
    @ApiResponse({ status: 201, description: 'Created claim', type: ItemClaim })
    @ApiResponse({ status: 400, description: 'Invalid item or claim' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createDto: CreateClaimDto,
    ): Promise<ItemClaim> {
        try {
            return await this.claimsService.create(createDto, req.user);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Get all claims (admin) or own claims (user)' })
    @ApiResponse({ status: 200, description: 'List of claims', type: [ItemClaim] })
    async findAll(
        @Query() filters: ClaimFilterDto,
        @Req() req: AuthenticatedRequest,
    ): Promise<{ claims: ItemClaim[]; page_context: { page: number; limit: number; total: number } }> {
        try {
            return await this.claimsService.findAll(filters, req.user);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Get details of a specific claim' })
    @ApiParam({ name: 'id', description: 'UUID of the claim' })
    @ApiResponse({ status: 200, description: 'Claim details', type: ItemClaim })
    @ApiResponse({ status: 404, description: 'Claim not found' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getClaim(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<ItemClaim> {
        try {
            return await this.claimsService.findOneById(id, req.user);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Post(':id/assign_receiver')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Assign a receiver to a claimed found item' })
    @ApiParam({ name: 'id', description: 'UUID of the claim' })
    @ApiResponse({ status: 201, description: 'Receiver assigned', type: ItemClaim })
    @ApiResponse({ status: 404, description: 'Claim or item not found' })
    @ApiResponse({ status: 400, description: 'Invalid receiver assignment' })
    async assignReceiver(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AssignReceiverDto,
        @Req() req: AuthenticatedRequest,
    ): Promise<ItemClaim | null> {
        try {
            return await this.claimsService.assignReceiver(id, dto, req.user);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }
}