import {
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
  ArrayNotEmpty,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductVariantInput {
  @IsString()
  size: string;

  @IsString()
  color: string;

  @IsNumber()
  @Type(() => Number)
  stock: number;

  @IsString()
  sku: string;
}

export class CreateProductDTO {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Type(() => Number)
  originalPrice: number;

  @IsNumber()
  @Type(() => Number)
  discount: number;

  @IsNumber()
  @Type(() => Number)
  rating: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInput)
  variants: ProductVariantInput[];

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  categoryIds: number[];
}
