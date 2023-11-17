import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from "@nestjs/common";
import { Observable, catchError } from "rxjs";
import {
	ChatNotFoundException,
	GameNotFoundException,
	UserNotFoundException,
} from "./not-found.exception";

export class UserNotFoundError extends Error {}
export class InviteNotFoundError extends Error {}
export class ChatNotFoundError extends Error {}
export class GameNotFoundError extends Error {}

@Injectable()
export class NotFoundInterceptor implements NestInterceptor {
	intercept(
		context: ExecutionContext,
		next: CallHandler<any>
	): Observable<any> | Promise<Observable<any>> {
		return next.handle().pipe(
			catchError((error) => {
				if (error instanceof UserNotFoundError) {
					console.log("INTERCEPTOR");
					throw new UserNotFoundException(error.message);
				} else if (error instanceof ChatNotFoundError) {
					throw new ChatNotFoundException(error.message);
				} else if (error instanceof GameNotFoundError) {
					throw new GameNotFoundException(error.message);
				} else {
					throw error;
				}
			})
		);
	}
}
