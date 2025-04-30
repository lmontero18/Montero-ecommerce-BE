import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  Get,
  Param,
  Delete,
  Query,
  NotFoundException,
  Put,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDTO } from './dto';
import { ParseJSONPipe } from 'src/shared/pipes/parse-json.pipe';
import { plainToInstance } from 'class-transformer';
import { FilterProductsDTO } from './dto/filter-products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get('filter')
  filter(@Query() query: any) {
    const dto: FilterProductsDTO = {
      name: query.name,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      sizes: query.sizes ? query.sizes.split(',') : undefined,
      categoryIds: query.categoryIds
        ? query.categoryIds.split(',').map(Number)
        : undefined,
    };

    return this.productService.filterProducts(dto);
  }

  @Get(':uuid')
  async findByUuid(@Param('uuid') uuid: string) {
    const product = await this.productService.findByUuid(uuid);

    if (!product) {
      throw new NotFoundException(`Producto con UUID ${uuid} no encontrado`);
    }

    return product;
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  createProduct(
    @Body(new ParseJSONPipe(['variants', 'categoryIds'])) rawDto: any,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const dto = plainToInstance(CreateProductDTO, rawDto);
    return this.productService.createProduct(dto, images);
  }
  @Delete(':uuid')
  deleteProduct(@Param('uuid') uuid: string) {
    return this.productService.deleteProduct(uuid);
  }

  @Put(':uuid')
  @UseInterceptors(FilesInterceptor('images'))
  updateProduct(
    @Param('uuid') uuid: string,
    @Body(new ParseJSONPipe(['variants', 'categoryIds', 'keptImageIds']))
    rawDto: any,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const dto = plainToInstance(CreateProductDTO, rawDto);
    return this.productService.updateProduct(
      uuid,
      dto,
      images,
      rawDto.keptImageIds,
    );
  }
}
