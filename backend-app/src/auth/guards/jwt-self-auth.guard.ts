import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// Implements JwtSelfStrategy:
// Checks if the JWT token user ID in the request header corresponds the route's ID param
// so that a user cannot modify another user's profile, for example

@Injectable()
export class JwtSelfAuthGuard extends AuthGuard("jwt-self-auth") {}
