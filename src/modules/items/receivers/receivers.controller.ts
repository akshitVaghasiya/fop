import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { UserRole } from 'src/common/models/users.model';
import { AssignReceiverDto } from '../dto/assign-receiver.dto';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';
import { ReceiversService } from './receivers.service';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';

@ApiTags('Item Receivers')
@ApiBearerAuth()
@Controller('items/:id/assign-receiver')
export class ReceiversController {
  constructor(private readonly receiversService: ReceiversService) { }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a receiver to an item' })
  @ApiResponse({ status: 201, description: 'Receiver successfully assigned' })
  @ApiResponse({ status: 404, description: 'Item or user not found' })
  @ApiResponse({
    status: 403,
    description: 'Cannot assign item to the owner or invalid interest',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the item',
  })
  async assignReceiver(
    @Param('id') item_id: string,
    @Body() dto: AssignReceiverDto,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      return await this.receiversService.assignReceiver(
        item_id,
        dto.receiver_user_id,
        req.user.id,
      );
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }
}