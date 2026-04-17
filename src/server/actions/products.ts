'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { productService } from '@/server/services/product.service';
import { productCreateSchema, productUpdateSchema } from '@/server/validators/products';
import { ApiError } from '@/lib/errors';

export type ProductFormState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

function parseForm(formData: FormData) {
  return {
    sku: formData.get('sku'),
    barcode: formData.get('barcode') ?? '',
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    type: formData.get('type') ?? 'FINISHED_GOOD',
    unit: formData.get('unit') ?? 'PCS',
    categoryId: formData.get('categoryId') ?? '',
    brandId: formData.get('brandId') ?? '',
    costPrice: formData.get('costPrice') ?? '0',
    sellPrice: formData.get('sellPrice') ?? '0',
    taxRate: formData.get('taxRate') ?? '0',
    reorderLevel: formData.get('reorderLevel') ?? '0',
    reorderQty: formData.get('reorderQty') ?? '0',
    isActive: formData.get('isActive') !== 'off',
    imageUrl: formData.get('imageUrl') ?? '',
  };
}

export async function createProductAction(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const parsed = productCreateSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await productService.create(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/inventory/products');
  redirect('/inventory/products');
}

export async function assignBarcodeAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  try {
    const session = await getSession();
    await productService.assignBarcode(session, id);
  } catch (e) {
    if (e instanceof ApiError) throw new Error(e.message);
    throw e;
  }
  revalidatePath('/inventory/products');
  revalidatePath('/barcode');
}

export async function updateProductAction(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const parsed = productUpdateSchema.safeParse({ id: formData.get('id'), ...parseForm(formData) });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await productService.update(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/inventory/products');
  redirect('/inventory/products');
}
