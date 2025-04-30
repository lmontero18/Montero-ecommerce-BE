import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class FilterProductsDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds?: number[];
}
