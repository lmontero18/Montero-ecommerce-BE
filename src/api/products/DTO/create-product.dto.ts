import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductVariantInput {
  @IsString()
  size: string;

  @IsString()
  color: string;

  @IsNumber()
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
  price: number;

  @IsNumber()
  originalPrice: number;

  @IsNumber()
  discount: number;

  @IsNumber()
  rating: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInput)
  variants: ProductVariantInput[];
}
