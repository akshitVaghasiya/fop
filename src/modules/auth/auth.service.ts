import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../../common/models/users.model';
import { JwtService } from '@nestjs/jwt';
import { UserDeactivatedException } from 'src/common/exceptions/user-deactivated.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async register(
    signUpDto: SignUpDto,
  ): Promise<{ data: Omit<User, 'password'>; message: string }> {
    const existingUser = await this.userService.findByEmail(signUpDto.email);

    if (existingUser) {
      throw new ConflictException({
        message: 'Email already registered',
        code: 'CONFLICT',
      });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(signUpDto.password, salt);

    const createdUser = await this.userService.create({
      name: signUpDto.name,
      email: signUpDto.email,
      password: hashedPassword,
    });

    return {
      data: createdUser,
      message: 'User registered successfully',
    };
  }

  async login(signInDto: SignInDto): Promise<{
    access_token: string;
    data: Omit<User, 'password'>;
    message: string;
  }> {
    const user = await this.userService.findByEmail(signInDto.email);
    if (!user) throw new NotFoundException('No user found');

    if (!user.is_active) {
      throw new UserDeactivatedException({
        message: 'Account deactivated',
        code: 'USER_DEACTIVATED',
      });
    }

    const isValid = await bcrypt.compare(signInDto.password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      id: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      data: user,
      message: 'Login successful',
    };
  }
}
