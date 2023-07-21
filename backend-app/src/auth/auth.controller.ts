import { Controller, Get, Req, Res, Redirect, Query } from '@nestjs/common';
import { Request } from 'express';
import axios from 'axios';

const CLIENT_ID = 'u-s4t2ud-18f16c113212b9bfe7b0841fdf7783641ed72d9a63359b4071a723862605ceea'; // Replace with your OAuth client ID
const CLIENT_SECRET = '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'; // Replace with your OAuth client secret

@Controller('auth')
export class AuthController {
    
    @Get()
    @Redirect(
	`https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-18f16c113212b9bfe7b0841fdf7783641ed72d9a63359b4071a723862605ceea&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fcallback&response_type=code`      
)
	connect42Api(){
    axios.defaults.baseURL = 'http://localhost:3001';
    axios.defaults.withCredentials = true;
    axios.get('https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-18f16c113212b9bfe7b0841fdf7783641ed72d9a63359b4071a723862605ceea&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fcallback&response_type=code');
		console.log("[AuthController] Redirecting to 42 API...");
	}

    @Get(':callback')
    async get42ApiResponse(@Req() req: Request, @Res() res: Response, @Query() code: string) {
        try {
                console.log('hahahaha');
                const { code } = req.query;
            
            
                const params = new URLSearchParams();
                params.append('grant_type', 'authorization_code');
                params.append('client_id', CLIENT_ID);
                params.append('client_secret', CLIENT_SECRET);
                params.append('code', code as string);
                params.append('redirect_uri', 'http://localhost:3001/auth/callback');
            
            
                // Exchange the authorization code for an access token
              //  console.log('Requesting access token...');
                const tokenResponse = await axios.post(
            
                  'https://api.intra.42.fr/oauth/token',
            
                  params
            
                );
            
                const accessToken = tokenResponse.data.access_token;
            
            
                // Use the access token for API requests
                //console.log('Requesting user details...');
                const userResponse = await axios.get('https://api.intra.42.fr/v2/me', {
            
                  headers: {
            
                    Authorization: `Bearer ${accessToken}`,
            
                  },
            
                });
            
            
                const userInfo = userResponse.data;
                const username = userInfo.login;
                const email = userInfo.email;
                const profilePicture= userInfo.image.link;
                const pageContent = `
                <h1>Hello, ${userInfo.login}! You are authorized through 42 API.</h1>
                <p>Email: ${email}</p>
                <img src="${profilePicture}"
                alt="Profile Picture">
                `;
                console.log(pageContent);
                return pageContent;
              } catch (error) {
		console.log("hahaha");            
                console.error(error);
            
                return 'An error occurred during the authorization process.';
              }
    }
}
