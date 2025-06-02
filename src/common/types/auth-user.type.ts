import { User } from 'src/common/models/users.model';

export type AuthUser = Pick<User, 'id' | 'email' | 'role'> & {
    role_name: string;
};
