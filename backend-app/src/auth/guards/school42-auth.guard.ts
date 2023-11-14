import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {AuthGuard} from '@nestjs/passport';

@Injectable()
export class school42AuthGuard extends AuthGuard('42') {
	constructor(private configService: ConfigService) {
		super({
			accessType: 'offline',
		});
	}
}
