// src/categories/categories.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async create(name: string) {
    return this.prisma.category.create({
      data: { name },
    });
  }
}
