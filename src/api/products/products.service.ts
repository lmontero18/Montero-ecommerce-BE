import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma';
import { CreateProductDTO } from './DTO';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        variants: true,
      },
    });
  }

  async findByUuid(uuid: string) {
    return this.prisma.product.findUnique({
      where: { uuid },
      include: {
        variants: true,
      },
    });
  }

  async createProduct(dto: CreateProductDTO) {
    try {
      return await this.prisma.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          originalPrice: dto.originalPrice,
          discount: dto.discount,
          rating: dto.rating,
          variants: {
            create: dto.variants,
          },
        },
        include: {
          variants: true,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('The SKU already exists');
      }

      throw error;
    }
  }
}
