import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AddCartItemDto,
  CreateAddressDto,
  UpdateCartItemDto,
} from './cart.dto';
import { CartRepository, CartRow } from '../infrastructure/cart.repository';

interface PresentedCartItem {
  id: string;
  variantId: string;
  quantity: number;
  unitPriceAmount: string;
  lineTotalAmount: string;
  availableQuantity: number;
  variantName: string;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

interface PresentedCartGroup {
  id: string;
  name: string;
  items: PresentedCartItem[];
  subtotalAmount: bigint;
}

@Injectable()
export class CartService {
  constructor(private readonly carts: CartRepository) {}

  async cart(userId: string) {
    return this.present(await this.carts.list(userId));
  }

  async add(userId: string, dto: AddCartItemDto) {
    const status = await this.carts.add(
      userId,
      dto.variantId,
      dto.quantity ?? 1,
    );
    if (status === 'VARIANT_NOT_FOUND')
      throw this.notFound('VARIANT_NOT_FOUND');
    if (status === 'BUYER_NOT_FOUND')
      throw this.notFound('BUYER_PROFILE_NOT_FOUND');
    if (status === 'INSUFFICIENT_STOCK') throw this.stockError();
    return this.cart(userId);
  }

  async update(userId: string, itemId: string, dto: UpdateCartItemDto) {
    if (!(await this.carts.update(userId, itemId, dto.quantity)))
      throw this.stockError();
    return this.cart(userId);
  }

  async remove(userId: string, itemId: string) {
    if (!(await this.carts.remove(userId, itemId)))
      throw this.notFound('CART_ITEM_NOT_FOUND');
  }

  addresses(userId: string) {
    return this.carts.addresses(userId);
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const address = await this.carts.createAddress(userId, dto);
    if (!address) throw this.notFound('BUYER_PROFILE_NOT_FOUND');
    return address;
  }

  private present(rows: CartRow[]) {
    const stores = new Map<string, PresentedCartGroup>();
    for (const row of rows) {
      const group = stores.get(row.store_id) ?? {
        id: row.store_id,
        name: row.store_name,
        items: [],
        subtotalAmount: 0n,
      };
      const lineTotal = BigInt(row.unit_price_amount) * BigInt(row.quantity);
      group.items.push({
        id: row.item_id,
        variantId: row.variant_id,
        quantity: row.quantity,
        unitPriceAmount: row.unit_price_amount,
        lineTotalAmount: String(lineTotal),
        availableQuantity: row.available_quantity,
        variantName: row.variant_name,
        product: {
          id: row.product_id,
          name: row.product_name,
          imageUrl: row.image_url,
        },
      });
      group.subtotalAmount += lineTotal;
      stores.set(row.store_id, group);
    }
    const groups = [...stores.values()].map((group) => ({
      ...group,
      subtotalAmount: String(group.subtotalAmount),
    }));
    return {
      id: rows[0]?.cart_id ?? null,
      version: rows[0]?.cart_version ?? 0,
      groups,
      subtotalAmount: String(
        groups.reduce((sum, group) => sum + BigInt(group.subtotalAmount), 0n),
      ),
    };
  }

  private notFound(code: string) {
    return new NotFoundException({
      code,
      detail: 'The requested resource does not exist.',
    });
  }

  private stockError() {
    return new UnprocessableEntityException({
      code: 'INSUFFICIENT_STOCK',
      detail: 'The requested quantity is not available.',
    });
  }
}
