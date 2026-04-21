import { User } from '../domain/entities';
import { PublicUserDto } from '../public/auth.types';

export class AuthApplicationMapper {
  /**
   * Translates a rich domain User entity into a safe output DTO.
   */
  static toPublicUserDto(user: User): PublicUserDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    };
  }
}
