const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const BASE = 'http://localhost:5173';

const routes = [
  { path: '/login', name: '01-login', public: true },
  { path: '/', name: '02-dashboard' },
  { path: '/sales', name: '03-sales-list' },
  { path: '/sales/return', name: '04-sale-return' },
  { path: '/sales/product-sale', name: '05-product-sale' },
  { path: '/sales/service-sale', name: '06-service-sale' },
  { path: '/contacts', name: '07-contacts' },
  { path: '/contacts/customers', name: '08-customers' },
  { path: '/contacts/suppliers', name: '09-suppliers' },
  { path: '/products', name: '10-products' },
  { path: '/products/add', name: '11-add-product' },
  { path: '/products/categories', name: '12-categories' },
  { path: '/products/brands', name: '13-brands' },
  { path: '/manufacturing/production', name: '14-production-planning' },
  { path: '/manufacturing/work-orders', name: '15-work-orders' },
  { path: '/manufacturing/bom', name: '16-bom' },
  { path: '/manufacturing/capacity', name: '17-capacity' },
  { path: '/manufacturing/subcontracting-items', name: '18-subcontracting-items' },
  { path: '/manufacturing/subcontracting-orders', name: '19-subcontracting-orders' },
  { path: '/manufacturing/subcontracting-billing', name: '20-subcontracting-billing' },
  { path: '/manufacturing/reports', name: '21-manufacturing-reports' },
  { path: '/inventory', name: '22-stock-list' },
  { path: '/inventory/opening-stock', name: '23-opening-stock' },
  { path: '/inventory/adjustment', name: '24-stock-adjustment' },
  { path: '/inventory/movement', name: '25-product-movement' },
  { path: '/purchase', name: '26-purchase-orders' },
  { path: '/purchase/return', name: '27-purchase-return' },
  { path: '/purchase/stock-alerts', name: '28-stock-alerts' },
  { path: '/purchase/cnf', name: '29-cnf' },
  { path: '/accounts/expenses', name: '30-expenses' },
  { path: '/accounts/income', name: '31-income' },
  { path: '/accounts/bank-accounts', name: '32-bank-accounts' },
  { path: '/accounts/chart', name: '33-chart-of-accounts' },
  { path: '/accounts/transactions', name: '34-transactions' },
  { path: '/accounts/profit-loss', name: '35-profit-loss' },
  { path: '/transfer', name: '36-transfer-history' },
  { path: '/transfer/new', name: '37-money-transfer' },
  { path: '/locations/branches', name: '38-branches' },
  { path: '/locations/warehouses', name: '39-warehouses' },
  { path: '/hrm', name: '40-staff-management' },
  { path: '/hrm/add-staff', name: '41-add-staff' },
  { path: '/hrm/departments', name: '42-departments' },
  { path: '/hrm/roles', name: '43-roles' },
  { path: '/hrm/attendance', name: '44-attendance' },
  { path: '/hrm/payroll', name: '45-payroll' },
  { path: '/hrm/loans', name: '46-loans' },
  { path: '/leave/types', name: '47-leave-types' },
  { path: '/leave/define', name: '48-leave-define' },
  { path: '/leave/apply', name: '49-apply-leave' },
  { path: '/leave/pending', name: '50-pending-requests' },
  { path: '/leave/holidays', name: '51-holidays' },
  { path: '/settings/general', name: '52-general-settings' },
  { path: '/settings/invoice', name: '53-invoice-settings' },
  { path: '/settings/email', name: '54-email-settings' },
  { path: '/settings/sms', name: '55-sms-settings' },
  { path: '/setup/tax', name: '56-tax-management' },
  { path: '/setup/country', name: '57-country-management' },
  { path: '/setup/language', name: '58-language-management' },
  { path: '/activity-log', name: '59-activity-log' },
  { path: '/profile', name: '60-profile' },
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = [];

  // Login first
  console.log('Logging in...');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('input[name="email"], input[type="email"]', 'admin@annexleather.com');
  await page.fill('input[name="password"], input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const afterLoginUrl = page.url();
  if (afterLoginUrl.includes('/login')) {
    console.log('LOGIN FAILED - still on login page');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '00-login-failed.png') });
    await browser.close();
    return;
  }
  console.log('Logged in. Redirected to:', afterLoginUrl);

  // Visit each route
  for (const route of routes) {
    if (route.public) continue; // skip login, already tested

    const errors = [];
    page.removeAllListeners('pageerror');
    page.on('pageerror', (err) => errors.push(err.message));

    const consoleErrors = [];
    page.removeAllListeners('console');
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      errors.push(`NAVIGATION: ${e.message}`);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${route.name}.png`), fullPage: true });

    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 100) || '');
    const isBlank = !bodyText.trim();
    const finalUrl = page.url();
    const redirected = !finalUrl.includes(route.path);

    const status = errors.length > 0 ? 'ERROR' : isBlank ? 'BLANK' : redirected ? 'REDIRECTED' : 'OK';

    results.push({
      route: route.path,
      name: route.name,
      status,
      errors: [...errors, ...consoleErrors],
      redirectedTo: redirected ? finalUrl : null,
    });

    const errStr = errors.length ? ` [${errors[0].substring(0, 80)}]` : '';
    const consStr = consoleErrors.length ? ` [console: ${consoleErrors[0].substring(0, 80)}]` : '';
    console.log(`${status.padEnd(10)} ${route.name.padEnd(35)} ${route.path}${errStr}${consStr}`);
  }

  // Summary
  const ok = results.filter((r) => r.status === 'OK').length;
  const errCount = results.filter((r) => r.status === 'ERROR').length;
  const blank = results.filter((r) => r.status === 'BLANK').length;
  const redir = results.filter((r) => r.status === 'REDIRECTED').length;

  console.log(`\n=== SUMMARY ===`);
  console.log(`OK: ${ok} | ERRORS: ${errCount} | BLANK: ${blank} | REDIRECTED: ${redir} | TOTAL: ${results.length}`);

  if (errCount > 0 || blank > 0) {
    console.log(`\n=== PROBLEMS ===`);
    results.filter((r) => r.status !== 'OK').forEach((r) => {
      console.log(`  ${r.status}: ${r.route}`);
      r.errors.forEach((e) => console.log(`    -> ${e.substring(0, 150)}`));
      if (r.redirectedTo) console.log(`    -> Redirected to: ${r.redirectedTo}`);
    });
  }

  await browser.close();
})();
