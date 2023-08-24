import {
  Controller,
  Get,
  Post,
  Request,
  Response,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { school42AuthGuard } from './guards/school42-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @Get('auth/42login')
  @UseGuards(school42AuthGuard)
  async school42Auth(@Request() req) {
    console.log('[Auth Controller]: GET on auth/42login');
  }

  @Get('auth/callback')
  @UseGuards(school42AuthGuard)
  school42AuthRedirect(
    @Request() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('[Auth Controller]: GET on auth/callback');
    return this.authService.school42Login(req, res);
  }
}
