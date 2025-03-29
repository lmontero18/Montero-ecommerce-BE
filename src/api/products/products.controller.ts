import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDTO } from './DTO';

@Controller({ path: 'products' })
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':uuid')
  findByUuid(@Param('uuid') uuid: string) {
    return this.productService.findByUuid(uuid);
  }

  @Post()
  createProduct(@Body() dto: CreateProductDTO) {
    return this.productService.createProduct(dto);
  }
}
