import {Controller,Get,Post,Request,Param,UseGuards,UseInterceptors,UploadedFile,UseFilters,BadRequestException,} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage} from 'multer';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { supabase } from 'src/supabaseClient';
import { MulterExceptionFilter } from 'src/filters/multerexception.filter';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];

function imageFileFilter(
  req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void
) {
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(new Error('Only image files (jpg, png, webp) are allowed'), false);
  }
  cb(null, true);
}

@Controller('products')
@UseFilters(new MulterExceptionFilter())
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: imageFileFilter,
    }),
  )
  async createProduct(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    try {
      const sellerId = req.user.userId;
      const { name, price, stock } = req.body;

      if (!name || !price || !stock) {
        throw new BadRequestException('name, price, and stock are required');
      }

      let imageUrl = '';
      if (file) {
        const fileExt = (file.originalname.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const pathInBucket = `products/${sellerId}/${fileName}`;

        const { error } = await supabase.storage
          .from('product-images')
          .upload(pathInBucket, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) {
          // apabila ada error dari supabase, lempar supaya masuk ke catch
          throw new Error(`Image upload failed: ${error.message || JSON.stringify(error)}`);
        }

        // ambil public url (atau gunakan signed URL jika bucket private)
        const { data } = supabase.storage.from('product-images').getPublicUrl(pathInBucket);
        imageUrl = data?.publicUrl || '';
      }

      const productData = {
        name,
        price: Number(price),
        stock: Number(stock),
        imageUrl,
      };

      const product = await this.productService.createProduct(productData, sellerId);
      return product;
    } catch (error) {
      return {
        statusCode: 500,
        message: error?.message || 'Failed to create product',
        error,
      };
    }
  }

  @Get()
  async getAllProducts() {
    return this.productService.getAllProducts();
  }

  @Get('seller/:sellerId')
  async getSellerProducts(@Param('sellerId') sellerId: number) {
    return this.productService.getSellerProducts(Number(sellerId));
  }
}
