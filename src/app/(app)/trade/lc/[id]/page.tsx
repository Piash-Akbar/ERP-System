import { notFound, redirect } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Pill, type PillTone } from '@/components/shared/pill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSession } from '@/server/auth/session';
import { tradeService } from '@/server/services/trade.service';
import { formatCurrency } from '@/lib/money';
import { LCActionButtons } from '@/components/trade/lc-action-buttons';
import { LCDrawdownList } from '@/components/trade/lc-drawdown-list';
import { LCAmendmentList } from '@/components/trade/lc-amendment-list';

export const metadata = { title: 'LC Detail' };

const LC_STATUS_TONE: Record<string, PillTone> = {
  DRAFT: 'grey', ISSUED: 'blue', ADVISED: 'blue', CONFIRMED: 'green',
  ACTIVE: 'green', AMENDED: 'amber', PARTIALLY_UTILIZED: 'amber',
  FULLY_UTILIZED: 'grey', EXPIRED: 'red', CLOSED: 'grey', CANCELLED: 'red',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value ?? '—'}</span>
    </div>
  );
}

export default async function LCDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const lc = await tradeService.getLC(session, id).catch(() => null);
  if (!lc) notFound();

  const utilizationPct = lc.lcAmount.gt(0)
    ? lc.utilizedAmount.div(lc.lcAmount).mul(100).toFixed(1)
    : '0';

  const expiringSoon =
    !['EXPIRED', 'CLOSED', 'CANCELLED', 'FULLY_UTILIZED'].includes(lc.status) &&
    new Date(lc.expiryDate).getTime() - Date.now() < 30 * 86400000;

  return (
    <div className="space-y-6">
      <PageHeader
        title={lc.number}
        description={`Letter of Credit — ${lc.type.replace(/_/g, ' ')} | ${lc.paymentMode.replace(/_/g, ' ')}`}
      >
        <Pill tone={LC_STATUS_TONE[lc.status] ?? 'grey'}>{lc.status.replace(/_/g, ' ')}</Pill>
        <LCActionButtons lc={{ id: lc.id, status: lc.status }} />
      </PageHeader>

      {expiringSoon && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          This LC expires on {new Date(lc.expiryDate).toLocaleDateString()} — within 30 days.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: LC details */}
        <div className="xl:col-span-2 space-y-4">

          <Card>
            <CardHeader><CardTitle className="text-sm">LC Parties</CardTitle></CardHeader>
            <CardContent className="divide-y">
              <Row label="Applicant (Importer)" value={lc.applicantName} />
              <Row label="Beneficiary (Exporter)" value={lc.beneficiaryName} />
              <Row label="Issuing Bank" value={
                <span>{lc.issuingBank}{lc.issuingBankSwift && <span className="ml-1 text-xs text-muted-foreground">({lc.issuingBankSwift})</span>}</span>
              } />
              <Row label="Advising Bank" value={lc.advisingBank} />
              <Row label="Confirming Bank" value={lc.confirmingBank} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Financial Terms</CardTitle></CardHeader>
            <CardContent className="divide-y">
              <Row label="LC Amount" value={formatCurrency(lc.lcAmount.toString(), lc.currency)} />
              <Row label="Tolerance" value={`+${lc.tolerancePlus}% / -${lc.toleranceMinus}%`} />
              <Row label="Utilized" value={
                <span>{formatCurrency(lc.utilizedAmount.toString(), lc.currency)}
                  <span className="ml-1 text-xs text-muted-foreground">({utilizationPct}%)</span>
                </span>
              } />
              <Row label="Available" value={
                <span className={lc.availableAmount.lte(0) ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(lc.availableAmount.toString(), lc.currency)}
                </span>
              } />
              <Row label="Payment Mode" value={lc.paymentMode.replace(/_/g, ' ')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Shipment & Dates</CardTitle></CardHeader>
            <CardContent className="divide-y">
              <Row label="Issue Date" value={new Date(lc.issueDate).toLocaleDateString()} />
              <Row label="Expiry Date" value={
                <span className={expiringSoon ? 'text-amber-600 font-semibold' : ''}>
                  {new Date(lc.expiryDate).toLocaleDateString()}
                </span>
              } />
              <Row label="Expiry Place" value={lc.expiryPlace} />
              <Row label="Latest Shipment Date" value={lc.latestShipDate ? new Date(lc.latestShipDate).toLocaleDateString() : null} />
              <Row label="Presentation Days" value={`${lc.presentationDays} days after BL date`} />
              <Row label="Port of Loading" value={lc.portOfLoading} />
              <Row label="Port of Discharge" value={lc.portOfDischarge} />
              <Row label="Partial Shipment" value={lc.partialShipment ? 'Allowed' : 'Not Allowed'} />
              <Row label="Transhipment" value={lc.transhipmentAllowed ? 'Allowed' : 'Not Allowed'} />
            </CardContent>
          </Card>

          {lc.goodsDescription && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Goods Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{lc.goodsDescription}</p>
              </CardContent>
            </Card>
          )}

          {lc.specialConditions && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Special Conditions</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lc.specialConditions}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Drawdowns & Amendments */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Utilization</CardTitle></CardHeader>
            <CardContent>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${Math.min(100, Number(utilizationPct))}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                {utilizationPct}% utilized of {formatCurrency(lc.lcAmount.toString(), lc.currency)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Linked Trade Order</CardTitle></CardHeader>
            <CardContent>
              <a href={`/trade/orders/${lc.tradeOrder.id}`} className="text-sm text-primary hover:underline font-mono">
                {lc.tradeOrder.number}
              </a>
              <p className="text-xs text-muted-foreground mt-1">
                {lc.tradeOrder.type} — {lc.tradeOrder.customer?.name ?? lc.tradeOrder.supplier?.name}
              </p>
            </CardContent>
          </Card>

          {lc.swiftMt700Ref && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">SWIFT MT700 Ref</p>
                <p className="text-sm font-mono">{lc.swiftMt700Ref}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <LCDrawdownList lcId={lc.id} drawdowns={lc.drawdowns} lcStatus={lc.status} currency={lc.currency} availableAmount={lc.availableAmount.toString()} />
      <LCAmendmentList lcId={lc.id} amendments={lc.amendments} lcStatus={lc.status} />
    </div>
  );
}
