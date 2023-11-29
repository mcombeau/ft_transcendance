import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from "@nestjs/common";
import { Observable, catchError } from "rxjs";
import {
	ChatCreationException,
	InvalidNameException,
	InvalidPasswordException,
	InviteCreationException,
} from "./bad-request.exception";

export class ChatCreationError extends Error {}
export class ChatJoinError extends Error {}
export class ChatMuteError extends Error {}
export class ChatPermissionError extends Error {}
export class GameCreationError extends Error {}
export class InviteCreationError extends Error {}
export class InvalidNameError extends Error {}
export class InvalidPasswordError extends Error {}
export class InvalidTokenError extends Error {}

@Injectable()
export class BadRequestInterceptor implements NestInterceptor {
	intercept(
		context: ExecutionContext,
		next: CallHandler<any>
	): Observable<any> | Promise<Observable<any>> {
		return next.handle().pipe(
			catchError((error) => {
				if (error instanceof ChatCreationError) {
					throw new ChatCreationException(error.message);
				} else if (error instanceof InviteCreationError) {
					throw new InviteCreationException(error.message);
				} else if (error instanceof InvalidNameError) {
					throw new InvalidNameException(error.message);
				} else if (error instanceof InvalidPasswordError) {
					throw new InvalidPasswordException(error.message);
				} else if (error instanceof InvalidTokenError) {
					throw new InvalidTokenError(error.message);
				} else {
					throw error;
				}
			})
		);
	}
}
