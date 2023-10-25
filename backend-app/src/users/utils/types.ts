export type createUserParams = {
  username: string;
  login42?: string;
  password?: string;
  email: string;
};

export type updateUserParams = {
  username?: string;
  newPassword?: string;
  currentPassword?: string;
  email?: string;
};
