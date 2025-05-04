import {
  ConflictException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma';
import { CreateProductDTO } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { SupabaseService } from 'src/shared/services/supabase/supabase.service';
import { FilterProductsDTO } from './dto/filter-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async findAll() {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        variants: true,
        images: true, // 👈 Asegurate de incluir las imágenes
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async findByUuid(uuid: string) {
    return this.prisma.product.findUnique({
      where: { uuid },
      include: {
        variants: true,
        images: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async uploadImage(file: Express.Multer.File) {
    const path = `products/${Date.now()}-${file.originalname}`;
    const { data, error } = await this.supabase
      .getClient()
      .storage.from('products')
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw new Error(error.message);

    const { data: publicUrlData } = this.supabase
      .getClient()
      .storage.from('products')
      .getPublicUrl(path);

    return {
      url: publicUrlData.publicUrl,
    };
  }

  async createProduct(dto: CreateProductDTO, images?: Express.Multer.File[]) {
    try {
      let imageUrls: string[] = [];

      if (images && images.length > 0) {
        for (const image of images) {
          const uploaded = await this.uploadImage(image);
          imageUrls.push(uploaded.url);
        }
      }

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
          images: {
            create: imageUrls.map((url) => ({ url })),
          },
          categories: {
            create: dto.categoryIds.map((categoryId) => ({
              category: { connect: { id: categoryId } },
            })),
          },
        },
        include: {
          variants: true,
          images: true,
          categories: { include: { category: true } },
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('The SKU already exists');
      }
      console.error('❌ Error al crear producto:', error);
      throw new BadRequestException('Error al crear producto');
    }
  }

  async deleteProduct(uuid: string) {
    const product = await this.prisma.product.findUnique({
      where: { uuid },
      include: { images: true, variants: true, categories: true },
    });

    if (!product) throw new BadRequestException('Producto no encontrado');

    for (const img of product.images) {
      const path = img.url.split('/storage/v1/object/public/products/')[1];
      if (path) {
        await this.supabase.getClient().storage.from('products').remove([path]);
      }
    }

    await this.prisma.productVariant.deleteMany({
      where: { productId: product.id },
    });

    await this.prisma.productCategory.deleteMany({
      where: { productId: product.id },
    });

    await this.prisma.productImage.deleteMany({
      where: { productId: product.id },
    });

    await this.prisma.product.delete({
      where: { uuid },
    });

    return { message: '✅ Producto eliminado correctamente' };
  }
  // src/api/products/products.service.ts
  // src/api/products/products.service.ts
  async filterProducts(dto: FilterProductsDTO) {
    const { name, minPrice, maxPrice, sizes, categoryIds } = dto;

    const where: any = {
      deletedAt: null,
    };

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (categoryIds?.length) {
      where.categories = {
        some: {
          categoryId: { in: categoryIds },
        },
      };
    }

    if (sizes?.length) {
      where.variants = {
        some: {
          size: { in: sizes },
        },
      };
    }

    console.log('🔍 Filter query where:', JSON.stringify(where, null, 2));

    const result = await this.prisma.product.findMany({
      where,
      include: {
        variants: true,
        images: true,
        categories: { include: { category: true } },
      },
    });

    return result;
  }
  async updateProduct(
    uuid: string,
    dto: CreateProductDTO,
    images?: Express.Multer.File[],
    keptImageIds?: number[],
  ) {
    const product = await this.prisma.product.findUnique({
      where: { uuid },
      include: { images: true },
    });

    if (!product) throw new BadRequestException('Producto no encontrado');

    // 📤 Subir nuevas imágenes
    const newImageUrls: string[] = [];
    if (images?.length) {
      for (const image of images) {
        const uploaded = await this.uploadImage(image);
        newImageUrls.push(uploaded.url);
      }
    }

    // 🧹 Filtrar imágenes a eliminar
    const imagesToDelete = product.images.filter(
      (img) => !keptImageIds?.includes(img.id),
    );

    for (const img of imagesToDelete) {
      const path = img.url.split('/storage/v1/object/public/products/')[1];
      if (path) {
        await this.supabase.getClient().storage.from('products').remove([path]);
      }
    }

    await this.prisma.productImage.deleteMany({
      where: {
        productId: product.id,
        id: { notIn: keptImageIds || [] },
      },
    });

    // 🧹 Limpiar variantes y categorías actuales
    await this.prisma.productVariant.deleteMany({
      where: { productId: product.id },
    });

    await this.prisma.productCategory.deleteMany({
      where: { productId: product.id },
    });

    // ✅ Limpiar las variantes antes de crearlas (sin id, uuid, etc.)
    const cleanVariants = dto.variants.map((v) => ({
      size: v.size,
      color: v.color,
      stock: v.stock,
      sku: v.sku,
    }));

    // ✅ Actualizar producto
    return await this.prisma.product.update({
      where: { uuid },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        originalPrice: dto.originalPrice,
        discount: dto.discount,
        rating: dto.rating,
        variants: {
          create: cleanVariants,
        },
        categories: {
          create: dto.categoryIds.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        },
        images: {
          create: newImageUrls.map((url) => ({ url })),
        },
      },
      include: {
        variants: true,
        images: true,
        categories: { include: { category: true } },
      },
    });
  }
  async decreaseStock(items: { variantId: number; quantity: number }[]) {
    for (const item of items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });

      if (!variant) {
        throw new Error(`❌ Variant ${item.variantId} not found`);
      }

      if (variant.stock < item.quantity) {
        throw new Error(`❌ Not enough stock for variant ${item.variantId}`);
      }

      await this.prisma.productVariant.update({
        where: { id: item.variantId },
        data: {
          stock: { decrement: item.quantity },
        },
      });
    }
  }
}
