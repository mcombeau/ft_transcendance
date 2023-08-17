import { Module, forwardRef } from '@nestjs/common';
import { PasswordService } from './password.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
  ],
  providers: [PasswordService],
  exports: [PasswordService]
})
export class PasswordModule {}
