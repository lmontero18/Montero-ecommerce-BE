import { IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name: string;
}
