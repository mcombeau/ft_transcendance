import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('friends')
@ApiTags('friends')
export class FriendsController {}
