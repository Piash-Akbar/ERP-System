'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Minus, Trash2, Scan, User, X, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, type CurrencyCode } from '@/lib/money';
import { createSaleAction } from '@/server/actions/pos';
import { POS_PAYMENT_METHODS, POS_DISCOUNT_APPROVAL_THRESHOLD } from '@/server/validators/pos';

interface TerminalProduct {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  unit: string;
  sellPrice: string;
  taxRate: string;
  imageUrl: string | null;
}

interface TerminalCustomer {
  id: string;
  code: string;
  name: string;
  type: string;
  creditLimit: string;
}

interface TerminalSession {
  id: string;
  branchId: string;
  warehouseId: string;
  branchName: string;
  warehouseName: string;
  currency: CurrencyCode;
  cashierName: string;
  openedAt: string;
}

interface CartLine {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
}

interface PaymentLine {
  method: (typeof POS_PAYMENT_METHODS)[number];
  amount: number;
  reference: string;
}

function lineNet(l: CartLine) {
  const gross = l.quantity * l.unitPrice;
  const discount = gross * (l.discountRate / 100);
  const net = gross - discount;
  const tax = net * (l.taxRate / 100);
  return { gross, discount, net, tax, total: net + tax };
}

export function PosTerminal({
  session,
  initialProducts,
  customers,
}: {
  session: TerminalSession;
  initialProducts: TerminalProduct[];
  customers: TerminalCustomer[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [scanQuery, setScanQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [payments, setPayments] = useState<PaymentLine[]>([
    { method: 'CASH', amount: 0, reference: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  const totals = useMemo(() => {
    return cart.reduce(
      (acc, l) => {
        const ln = lineNet(l);
        acc.subtotal += ln.gross;
        acc.discount += ln.discount;
        acc.tax += ln.tax;
        acc.total += ln.total;
        return acc;
      },
      { subtotal: 0, discount: 0, tax: 0, total: 0 },
    );
  }, [cart]);

  const paidTotal = payments.reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const cashPaid = payments.filter((p) => p.method === 'CASH').reduce((a, p) => a + p.amount, 0);
  const changeDue = cashPaid > 0 ? Math.max(0, paidTotal - totals.total) : 0;
  const balance = totals.total - paidTotal;

  const fmt = (v: number) => formatCurrency(v, session.currency);

  async function searchProducts(q: string) {
    setScanQuery(q);
    const res = await fetch(`/api/pos/search?q=${encodeURIComponent(q)}`);
    if (res.ok) setProducts(await res.json());
  }

  function addToCart(p: TerminalProduct) {
    setCart((prev) => {
      const hit = prev.find((l) => l.productId === p.id);
      if (hit) {
        return prev.map((l) =>
          l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          unit: p.unit,
          quantity: 1,
          unitPrice: Number(p.sellPrice),
          discountRate: 0,
          taxRate: Number(p.taxRate),
        },
      ];
    });
  }

  function setQty(productId: string, q: number) {
    if (q <= 0) {
      setCart((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    setCart((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity: q } : l)));
  }

  function setDiscount(productId: string, d: number) {
    setCart((prev) =>
      prev.map((l) =>
        l.productId === productId
          ? { ...l, discountRate: Math.max(0, Math.min(100, d)) }
          : l,
      ),
    );
  }

  function onScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = scanQuery.trim();
    if (!q) return;
    // If exact barcode/sku match in loaded products, add immediately
    const exact = products.find((p) => p.barcode === q || p.sku.toLowerCase() === q.toLowerCase());
    if (exact) {
      addToCart(exact);
      setScanQuery('');
      scanRef.current?.focus();
    } else {
      searchProducts(q);
    }
  }

  function clearCart() {
    setCart([]);
    setCustomerId('');
    setPayments([{ method: 'CASH', amount: 0, reference: '' }]);
    setNotes('');
    setMessage(null);
  }

  function setPayment(idx: number, patch: Partial<PaymentLine>) {
    setPayments((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  function addPayment() {
    setPayments((prev) => [...prev, { method: 'CARD', amount: 0, reference: '' }]);
  }
  function removePayment(idx: number) {
    setPayments((prev) => prev.filter((_, i) => i !== idx));
  }

  function submit() {
    if (cart.length === 0) {
      setMessage({ type: 'err', text: 'Cart is empty' });
      return;
    }
    if (paidTotal < totals.total) {
      setMessage({ type: 'err', text: `Underpaid by ${fmt(balance)}` });
      return;
    }
    startTransition(async () => {
      const res = await createSaleAction({
        branchId: session.branchId,
        warehouseId: session.warehouseId,
        sessionId: session.id,
        customerId: customerId || undefined,
        items: cart.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountRate: l.discountRate,
          taxRate: l.taxRate,
        })),
        payments: payments
          .filter((p) => p.amount > 0)
          .map((p) => ({
            method: p.method,
            amount: p.amount,
            reference: p.reference || undefined,
          })),
        notes: notes || undefined,
      });
      if (res && 'error' in res && res.error) {
        setMessage({ type: 'err', text: res.error });
        return;
      }
      if (res && 'success' in res && res.success) {
        setMessage({ type: 'ok', text: `Sale ${res.saleNumber} completed — change ${fmt(changeDue)}` });
        clearCart();
        router.refresh();
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-4 min-h-[calc(100vh-8rem)]">
      {/* Left: scan + product grid */}
      <div className="flex flex-col gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-muted-foreground">Session</div>
              <div className="text-sm font-medium">
                {session.branchName} · {session.warehouseName}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/pos/sessions">Close session</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/pos/sales">Sales</Link>
              </Button>
            </div>
          </div>
          <form onSubmit={onScanSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={scanRef}
                autoFocus
                className="pl-9"
                placeholder="Scan barcode / SKU or search…"
                value={scanQuery}
                onChange={(e) => searchProducts(e.target.value)}
              />
            </div>
            <Button type="submit" variant="dark">
              Add
            </Button>
          </form>
        </Card>

        <Card className="p-3 flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addToCart(p)}
                className="text-left rounded-lg border p-3 hover:border-blue-600 hover:shadow-sm transition"
              >
                <div className="text-xs text-muted-foreground">{p.sku}</div>
                <div className="text-sm font-medium line-clamp-2 mt-0.5">{p.name}</div>
                <div className="text-sm font-semibold text-blue-600 mt-2 tabular">
                  {fmt(Number(p.sellPrice))}
                </div>
              </button>
            ))}
            {products.length === 0 && (
              <div className="col-span-full text-center text-sm text-muted-foreground py-10">
                No products match.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right: cart + payment */}
      <div className="flex flex-col gap-4">
        <Card className="p-4">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" /> Customer
          </label>
          <select
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Walk-in</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name} ({c.type.toLowerCase()})
              </option>
            ))}
          </select>
        </Card>

        <Card className="p-0 flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b text-sm font-medium flex items-center justify-between">
            <span>Cart · {cart.length} line{cart.length === 1 ? '' : 's'}</span>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {cart.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-10">
                Scan or click a product to begin.
              </div>
            )}
            {cart.map((l) => {
              const ln = lineNet(l);
              const flag = l.discountRate > POS_DISCOUNT_APPROVAL_THRESHOLD;
              return (
                <div key={l.productId} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">{l.sku}</div>
                      <div className="text-sm font-medium truncate">{l.name}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQty(l.productId, 0)}
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center rounded-md border">
                      <button
                        type="button"
                        className="px-2 py-1 hover:bg-muted"
                        onClick={() => setQty(l.productId, l.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        className="w-14 text-center text-sm bg-transparent outline-none tabular"
                        value={l.quantity}
                        min={0}
                        step="any"
                        onChange={(e) => setQty(l.productId, Number(e.target.value))}
                      />
                      <button
                        type="button"
                        className="px-2 py-1 hover:bg-muted"
                        onClick={() => setQty(l.productId, l.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">× {fmt(l.unitPrice)}</span>
                    <div className="ml-auto text-sm font-semibold tabular">{fmt(ln.total)}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Disc %</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="any"
                      value={l.discountRate}
                      onChange={(e) => setDiscount(l.productId, Number(e.target.value))}
                      className={`w-16 rounded border px-1.5 py-0.5 text-right tabular ${
                        flag ? 'border-amber-500 text-amber-700' : ''
                      }`}
                    />
                    {flag && (
                      <span className="text-amber-700">needs override</span>
                    )}
                    <span className="text-muted-foreground ml-auto">Tax {l.taxRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t p-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular">{fmt(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span>
              <span className="tabular">−{fmt(totals.discount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span className="tabular">{fmt(totals.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-2 border-t mt-2">
              <span>Total</span>
              <span className="tabular">{fmt(totals.total)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="text-sm font-medium">Payment</div>
          {payments.map((p, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={p.method}
                onChange={(e) => setPayment(i, { method: e.target.value as PaymentLine['method'] })}
                className="flex h-9 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {POS_PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={0}
                step="any"
                placeholder="0.00"
                value={p.amount || ''}
                onChange={(e) => setPayment(i, { amount: Number(e.target.value) })}
                className="text-right tabular"
              />
              {payments.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removePayment(i)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addPayment}>
            <Plus className="h-3 w-3" /> Split payment
          </Button>

          <div className="flex justify-between text-sm pt-2 border-t">
            <span>Paid</span>
            <span className="tabular">{fmt(paidTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Change</span>
            <span className="tabular text-emerald-600">{fmt(changeDue)}</span>
          </div>
          {balance > 0.001 && (
            <div className="flex justify-between text-sm font-medium">
              <span className="text-red-600">Balance due</span>
              <span className="tabular text-red-600">{fmt(balance)}</span>
            </div>
          )}

          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {message && (
            <div
              className={`text-sm rounded-md px-3 py-2 ${
                message.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {message.type === 'ok' && <CheckCircle2 className="inline h-4 w-4 mr-1" />}
              {message.text}
            </div>
          )}

          <Button
            variant="dark"
            size="lg"
            className="w-full"
            onClick={submit}
            disabled={pending || cart.length === 0}
          >
            {pending ? 'Processing…' : `Charge ${fmt(totals.total)}`}
          </Button>
        </Card>
      </div>
    </div>
  );
}
