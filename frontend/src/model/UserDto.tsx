// Interfaces basadas en tus DTOs de Spring Boot
export interface UserDTO {
  id: number;
  username: string;
  email: string;
  colorCode: string;
  profilePicturePath: string;
  role: string;
}
