import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
// import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  imports: [
	UsersModule,
	PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'FT_TRANSCENDENCE_JSONWEBTOKEN1029384756', // Replace with your own secret key for signing the token
      signOptions: { expiresIn: '1h' }, // Token expires in 1 hour
    }),
],
  //   providers: [AuthService]
})

export class AuthModule {}
