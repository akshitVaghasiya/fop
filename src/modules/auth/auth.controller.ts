import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Public } from 'src/common/decorators/public/public.decorator';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { User } from 'src/common/models/users.model';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { PermissionGuard } from 'src/common/guards/roles/permission.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() signUpDto: SignUpDto) {
    try {
      return await this.authService.register(signUpDto);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({
    status: 404,
    description: 'No user found with the given email',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account deactivated' })
  async login(@Body() signInDto: SignInDto) {
    try {
      return await this.authService.login(signInDto);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Get('user_info')
  @ApiBearerAuth()
  // @Roles(UserRole.ADMIN, UserRole.USER)
  @Roles('auth_user_info')
  @UseGuards(PermissionGuard)
  @ApiOperation({ summary: 'Get current user details' })
  @ApiResponse({ status: 200, description: 'Current user details', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async userInfo(@Req() req: AuthenticatedRequest) {
    try {
      console.log("req.user-->", req.user);

      return await this.authService.userInfo(req.user.id);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New access and refresh tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    try {
      return await this.authService.refreshToken(refreshTokenDto.refresh_token);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Post('change_password')
  @ApiBearerAuth()
  // @Roles(UserRole.ADMIN, UserRole.USER)
  @Roles('auth_change_password')
  @UseGuards(PermissionGuard)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid old password' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      const userId = req.user.id;
      return await this.authService.changePassword(userId, changePasswordDto);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }
}