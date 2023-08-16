import { Controller, Get, Post, Request, Response, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { school42AuthGuard } from './guards/school42-auth.guard';

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
    console.log("[Auth Controller]: GET on auth/42login");
  }

  @Get('auth/callback')
  @UseGuards(school42AuthGuard)
  school42AuthRedirect(
    @Request() req: Request, 
    @Res({ passthrough: true }) res: Response
  ) {
    console.log("[Auth Controller]: GET on auth/callback");
    return this.authService.school42Login(req, res);
  }
}

// import {
//   Controller,
//   Get,
//   Req,
//   Res,
//   Redirect,
//   Query,
//   Inject,
// } from '@nestjs/common';
// import { Request } from 'express';
// import axios from 'axios';
// import { Response } from 'express';
// import { UsersService } from 'src/users/users.service';
// import { ApiTags } from '@nestjs/swagger';
// import { JwtAuthGuard } from './jwt-auth.guard';
// import { UserEntity } from 'src/users/entities/user.entity';
// import { JwtService } from '@nestjs/jwt';

// const CLIENT_ID =
//   'u-s4t2ud-18f16c113212b9bfe7b0841fdf7783641ed72d9a63359b4071a723862605ceea'; // Replace with your OAuth client ID
// const CLIENT_SECRET =
//   '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'; // Replace with your OAuth client secret

// @Controller('auth')
// @ApiTags('auth')
// export class AuthController {
//   constructor(
//     private usersService: UsersService,
//     private jwtService: JwtService
//   ) {}

//   @Get()
//   @Redirect(
//     `https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-18f16c113212b9bfe7b0841fdf7783641ed72d9a63359b4071a723862605ceea&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fcallback&response_type=code`,
//   )
//   connect42Api() {
//     axios.defaults.baseURL = 'http://localhost:3001';
//     axios.defaults.withCredentials = true;
//     axios.get(
//       'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-18f16c113212b9bfe7b0841fdf7783641ed72d9a63359b4071a723862605ceea&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fcallback&response_type=code',
//     );
//     console.log('[AuthController] Redirecting to 42 API...');
//   }

//   @Redirect()
//   async logInUser(@Res() res: Response, user: UserEntity) {
//     res.redirect('http://localhost:3000');
//     const payload = { sub: user.id, username: user.username };
//     const token = await this.jwtService.signAsync(payload);
//     console.log("TOKEN:", token);
//     return {
//       access_token: token,
//     };
//   }

//   @Get(':callback')
//   async get42ApiResponse(
//     @Req() req: Request,
//     @Res() res: Response,
//     @Query() code: string,
//   ) {
//     try {
//       const { code } = req.query;

//       const params = new URLSearchParams();
//       params.append('grant_type', 'authorization_code');
//       params.append('client_id', CLIENT_ID);
//       params.append('client_secret', CLIENT_SECRET);
//       params.append('code', code as string);
//       params.append('redirect_uri', 'http://localhost:3001/auth/callback');

//       // Exchange the authorization code for an access token
//       //  console.log('Requesting access token...');
//       const tokenResponse = await axios.post(
//         'https://api.intra.42.fr/oauth/token',

//         params,
//       );

//       const accessToken = tokenResponse.data.access_token;

//       // Use the access token for API requests
//       //console.log('Requesting user details...');
//       const userResponse = await axios.get('https://api.intra.42.fr/v2/me', {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//       });

//       const userInfo = userResponse.data;
//       const username = userInfo.login;
//       const email = userInfo.email;
//       const profilePicture = userInfo.image.link;

//       // Creating user in the database
//       var existingUser = await this.usersService.fetchUserByUsername(username);
//       if (!existingUser) {
//         this.usersService.createUser({
//           username: username,
//           email: email
//         });
//       }
//       console.log("Get done.");
//       return this.logInUser(res, username);
//     } catch (error) {
//       console.error(error);
//       return 'An error occurred during the authorization process.';
//     }
//   }
// }
