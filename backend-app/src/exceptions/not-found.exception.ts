import { NotFoundException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`User '${identifier}' not found`);
  }
}

export class ChatNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Chat '${identifier}' not found`);
  }
}

export class ChatMessageNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Chat message '${identifier}' not found`);
  }
}

export class GameNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Game '${identifier}' not found`);
  }
}
