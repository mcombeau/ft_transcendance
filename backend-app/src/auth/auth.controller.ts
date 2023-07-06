import { Controller, Get, Req, Res, Redirect, Query } from '@nestjs/common';
import axios from 'axios';

const CLIENT_ID = 'u-s4t2ud-5bc97c50c4272f69f40976b44b45a630d5d9bc01a55644fbd6ab4e391c549ff5'; // Replace with your OAuth client ID
const CLIENT_SECRET = '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'; // Replace with your OAuth client secret

@Controller('auth')
export class AuthController {
    
    @Get()
    @Redirect(
      'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-5bc97c50c4272f69f40976b44b45a630d5d9bc01a55644fbd6ab4e391c549ff5&redirect_uri=http://localhost:3001/callback&response_type=code/'
      )
	connect42Api(){
    // axios.defaults.baseURL = 'http://localhost:3000';
    // axios.defaults.withCredentials = true;
    // axios.get('https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-5bc97c50c4272f69f40976b44b45a630d5d9bc01a55644fbd6ab4e391c549ff5&redirect_uri=http://localhost:3001/callback&response_type=code');
		console.log("GOT HERE");
	}

    @Get('callback')
    async get42ApiResponse(@Req() req: Request, @Query() code: string) {
        try {
            //    console.log('hahahaha');
                // const { code } = req.query;
            
            
                const params = new URLSearchParams();
                params.append('grant_type', 'authorization_code');
                params.append('client_id', CLIENT_ID);
                params.append('client_secret', CLIENT_SECRET);
                params.append('code', code as string);
                params.append('redirect_uri', 'http://localhost:3001/callback');
            
            
                // Exchange the authorization code for an access token
              //  console.log('Requesting access token...');
                const tokenResponse = await axios.post(
            
                  'https://api.intra.42.fr/oauth/token',
            
                  params
            
                );
            
                const accessToken = tokenResponse.data.access_token;
            
            
                // Use the access token for API requests
                //console.log('Requesting user details...');
                const userResponse = await axios.get(`https://api.intra.42.fr/v2/me`, {
            
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
            
                console.error(error);
            
                return 'An lsdfsldfkerror occurred during the authorization process.';
              }
    }
}
