//TODO: Move id and secret to env variable!!!
const CLIENT_ID ='u-s4t2ud-18f16c113212b9bfe7b0841fdf7783641ed72d9a63359b4071a723862605ceea'; // Replace with your OAuth client ID
const CLIENT_SECRET ='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'; // Replace with your OAuth client secret

import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-oauth2';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class school42Strategy extends PassportStrategy(Strategy, '42') {
  constructor(
    @Inject(forwardRef(() => UsersService)) private userService: UsersService,
  ) {
    super({
      authorizationURL: 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-18f16c113212b9bfe7b0841fdf7783641ed72d9a63359b4071a723862605ceea&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fcallback&response_type=code',
      tokenURL: 'https://api.intra.42.fr/oauth/token',
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      callbackURL: 'http://localhost:3001/auth/callback',
      // scope: ['email', 'profile'],
    });
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const userInfo = profile.data;
    const username = profile.login;
    const email = profile.email;
    const profilePicture = profile.image.link;

    var user = await this.userService.fetchUserByUsername(username);
    if (!user) {
      user = await this.userService.createUser({
        username: username,
        password:'pass',
        email: email
      });
      return (user);
    }
    // Create jwt token?

    // const { name, emails, photos } = profile;
    // const user = {
    //   email: emails[0].value,
    //   firstName: name.givenName,
    //   lastName: name.familyName,
    //   picture: photos[0].value,
    //   accessToken,
    //   refreshToken,
    // };
    done(null, user);
  }
}