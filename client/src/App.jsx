import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WarehouseProvider } from './context/WarehouseContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';

// Dashboard
import Dashboard from './pages/Dashboard';

// Sales
import SaleList from './pages/sales/SaleList';
import SaleReturn from './pages/sales/SaleReturn';
import ProductSale from './pages/sales/ProductSale';
import ServiceSale from './pages/sales/ServiceSale';

// Contacts
import ContactList from './pages/contacts/ContactList';
import Customers from './pages/contacts/Customers';
import Suppliers from './pages/contacts/Suppliers';

// Products
import ProductList from './pages/products/ProductList';
import AddProduct from './pages/products/AddProduct';
import Categories from './pages/products/Categories';
import Brands from './pages/products/Brands';

// Manufacturing
import ProductionPlanning from './pages/manufacturing/ProductionPlanning';
import WorkOrders from './pages/manufacturing/WorkOrders';
import BillOfMaterials from './pages/manufacturing/BillOfMaterials';
import CapacityPlanning from './pages/manufacturing/CapacityPlanning';
import SubcontractingItems from './pages/manufacturing/SubcontractingItems';
import SubcontractingOrders from './pages/manufacturing/SubcontractingOrders';
import SubcontractingBilling from './pages/manufacturing/SubcontractingBilling';
import ManufacturingReports from './pages/manufacturing/ManufacturingReports';

// Inventory
import StockList from './pages/inventory/StockList';
import OpeningStock from './pages/inventory/OpeningStock';
import StockAdjustment from './pages/inventory/StockAdjustment';
import ProductMovement from './pages/inventory/ProductMovement';

// Purchase
import PurchaseOrders from './pages/purchase/PurchaseOrders';
import PurchaseReturn from './pages/purchase/PurchaseReturn';
import StockAlerts from './pages/purchase/StockAlerts';
import CNFManagement from './pages/purchase/CNFManagement';

// Accounts
import Expenses from './pages/accounts/Expenses';
import Income from './pages/accounts/Income';
import BankAccounts from './pages/accounts/BankAccounts';
import ChartOfAccounts from './pages/accounts/ChartOfAccounts';
import Transactions from './pages/accounts/Transactions';
import ProfitLoss from './pages/accounts/ProfitLoss';

// Transfer
import MoneyTransfer from './pages/transfer/MoneyTransfer';
import TransferHistory from './pages/transfer/TransferHistory';

// Locations
import Branches from './pages/locations/Branches';
import Warehouses from './pages/locations/Warehouses';

// HRM
import StaffManagement from './pages/hrm/StaffManagement';
import AddStaff from './pages/hrm/AddStaff';
import Departments from './pages/hrm/Departments';
import Roles from './pages/hrm/Roles';
import Attendance from './pages/hrm/Attendance';
import Payroll from './pages/hrm/Payroll';
import StaffLoans from './pages/hrm/StaffLoans';

// Leave
import LeaveTypes from './pages/leave/LeaveTypes';
import LeaveDefine from './pages/leave/LeaveDefine';
import ApplyLeave from './pages/leave/ApplyLeave';
import PendingRequests from './pages/leave/PendingRequests';
import HolidaySetup from './pages/leave/HolidaySetup';

// Settings
import GeneralSettings from './pages/settings/GeneralSettings';
import InvoiceSettings from './pages/settings/InvoiceSettings';
import EmailSettings from './pages/settings/EmailSettings';
import SMSSettings from './pages/settings/SMSSettings';

// Setup
import TaxManagement from './pages/setup/TaxManagement';
import CountryManagement from './pages/setup/CountryManagement';
import LanguageManagement from './pages/setup/LanguageManagement';

// Activity Log
import ActivityLogList from './pages/activitylog/ActivityLogList';

// User Management
import UserList from './pages/users/UserList';

// Approvals
import ApprovalQueue from './pages/approvals/ApprovalQueue';
import ApprovalDetail from './pages/approvals/ApprovalDetail';
import MySubmissions from './pages/approvals/MySubmissions';
import ApprovalRulesConfig from './pages/approvals/ApprovalRulesConfig';

// Assets
import AssetList from './pages/assets/AssetList';
import AssetForm from './pages/assets/AssetForm';
import AssetDetail from './pages/assets/AssetDetail';
import AssetCategories from './pages/assets/AssetCategories';

// Documents
import DocumentList from './pages/documents/DocumentList';
import DocumentDetail from './pages/documents/DocumentDetail';
import ExpiringDocuments from './pages/documents/ExpiringDocuments';

// Barcodes
import BarcodeDashboard from './pages/barcodes/BarcodeDashboard';
import BarcodeGenerator from './pages/barcodes/BarcodeGenerator';
import BarcodePrint from './pages/barcodes/BarcodePrint';
import BarcodeScanner from './pages/barcodes/BarcodeScanner';

// Warehouse Operations
import WarehouseDashboard from './pages/warehouse/WarehouseDashboard';
import GoodsReceiving from './pages/warehouse/GoodsReceiving';
import GoodsIssue from './pages/warehouse/GoodsIssue';
import WarehouseTransfer from './pages/warehouse/WarehouseTransfer';
import StockReconciliation from './pages/warehouse/StockReconciliation';
import PhysicalStockCount from './pages/warehouse/PhysicalStockCount';
import WarehouseLedger from './pages/warehouse/WarehouseLedger';
import WarehouseReturns from './pages/warehouse/WarehouseReturns';
import WarehouseOpsSettings from './pages/warehouse/WarehouseOpsSettings';

// Profile
import Profile from './pages/Profile';

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <WarehouseProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* Sales */}
            <Route path="/sales" element={<SaleList />} />
            <Route path="/sales/return" element={<SaleReturn />} />
            <Route path="/sales/product-sale" element={<ProductSale />} />
            <Route path="/sales/service-sale" element={<ServiceSale />} />

            {/* Contacts */}
            <Route path="/contacts" element={<ContactList />} />
            <Route path="/contacts/customers" element={<Customers />} />
            <Route path="/contacts/suppliers" element={<Suppliers />} />

            {/* Products */}
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/add" element={<AddProduct />} />
            <Route path="/products/categories" element={<Categories />} />
            <Route path="/products/brands" element={<Brands />} />

            {/* Manufacturing */}
            <Route path="/manufacturing/production" element={<ProductionPlanning />} />
            <Route path="/manufacturing/work-orders" element={<WorkOrders />} />
            <Route path="/manufacturing/bom" element={<BillOfMaterials />} />
            <Route path="/manufacturing/capacity" element={<CapacityPlanning />} />
            <Route path="/manufacturing/subcontracting-items" element={<SubcontractingItems />} />
            <Route path="/manufacturing/subcontracting-orders" element={<SubcontractingOrders />} />
            <Route path="/manufacturing/subcontracting-billing" element={<SubcontractingBilling />} />
            <Route path="/manufacturing/reports" element={<ManufacturingReports />} />

            {/* Inventory */}
            <Route path="/inventory" element={<StockList />} />
            <Route path="/inventory/opening-stock" element={<OpeningStock />} />
            <Route path="/inventory/adjustment" element={<StockAdjustment />} />
            <Route path="/inventory/movement" element={<ProductMovement />} />

            {/* Purchase */}
            <Route path="/purchase" element={<PurchaseOrders />} />
            <Route path="/purchase/return" element={<PurchaseReturn />} />
            <Route path="/purchase/stock-alerts" element={<StockAlerts />} />
            <Route path="/purchase/cnf" element={<CNFManagement />} />

            {/* Accounts */}
            <Route path="/accounts/expenses" element={<Expenses />} />
            <Route path="/accounts/income" element={<Income />} />
            <Route path="/accounts/bank-accounts" element={<BankAccounts />} />
            <Route path="/accounts/chart" element={<ChartOfAccounts />} />
            <Route path="/accounts/transactions" element={<Transactions />} />
            <Route path="/accounts/profit-loss" element={<ProfitLoss />} />

            {/* Transfer */}
            <Route path="/transfer" element={<TransferHistory />} />
            <Route path="/transfer/new" element={<MoneyTransfer />} />

            {/* Locations */}
            <Route path="/locations/branches" element={<Branches />} />
            <Route path="/locations/warehouses" element={<Warehouses />} />

            {/* HRM */}
            <Route path="/hrm" element={<StaffManagement />} />
            <Route path="/hrm/add-staff" element={<AddStaff />} />
            <Route path="/hrm/departments" element={<Departments />} />
            <Route path="/hrm/roles" element={<Roles />} />
            <Route path="/hrm/attendance" element={<Attendance />} />
            <Route path="/hrm/payroll" element={<Payroll />} />
            <Route path="/hrm/loans" element={<StaffLoans />} />

            {/* Leave */}
            <Route path="/leave/types" element={<LeaveTypes />} />
            <Route path="/leave/define" element={<LeaveDefine />} />
            <Route path="/leave/apply" element={<ApplyLeave />} />
            <Route path="/leave/pending" element={<PendingRequests />} />
            <Route path="/leave/holidays" element={<HolidaySetup />} />

            {/* Settings */}
            <Route path="/settings/general" element={<GeneralSettings />} />
            <Route path="/settings/invoice" element={<InvoiceSettings />} />
            <Route path="/settings/email" element={<EmailSettings />} />
            <Route path="/settings/sms" element={<SMSSettings />} />

            {/* Setup */}
            <Route path="/setup/tax" element={<TaxManagement />} />
            <Route path="/setup/country" element={<CountryManagement />} />
            <Route path="/setup/language" element={<LanguageManagement />} />

            {/* User Management */}
            <Route path="/users" element={<UserList />} />

            {/* Approvals */}
            <Route path="/approvals" element={<ApprovalQueue />} />
            <Route path="/approvals/my-submissions" element={<MySubmissions />} />
            <Route path="/approvals/rules" element={<ApprovalRulesConfig />} />
            <Route path="/approvals/:id" element={<ApprovalDetail />} />

            {/* Assets */}
            <Route path="/assets" element={<AssetList />} />
            <Route path="/assets/new" element={<AssetForm />} />
            <Route path="/assets/categories" element={<AssetCategories />} />
            <Route path="/assets/:id/edit" element={<AssetForm />} />
            <Route path="/assets/:id" element={<AssetDetail />} />

            {/* Documents */}
            <Route path="/documents" element={<DocumentList />} />
            <Route path="/documents/expiring" element={<ExpiringDocuments />} />
            <Route path="/documents/:id" element={<DocumentDetail />} />

            {/* Warehouse Operations */}
            <Route path="/warehouse" element={<WarehouseDashboard />} />
            <Route path="/warehouse/receiving" element={<GoodsReceiving />} />
            <Route path="/warehouse/issue" element={<GoodsIssue />} />
            <Route path="/warehouse/transfer" element={<WarehouseTransfer />} />
            <Route path="/warehouse/reconciliation" element={<StockReconciliation />} />
            <Route path="/warehouse/stock-count" element={<PhysicalStockCount />} />
            <Route path="/warehouse/ledger" element={<WarehouseLedger />} />
            <Route path="/warehouse/returns" element={<WarehouseReturns />} />
            <Route path="/warehouse/settings" element={<WarehouseOpsSettings />} />

            {/* Barcodes */}
            <Route path="/barcodes" element={<BarcodeDashboard />} />
            <Route path="/barcodes/generate" element={<BarcodeGenerator />} />
            <Route path="/barcodes/print" element={<BarcodePrint />} />
            <Route path="/barcodes/scan" element={<BarcodeScanner />} />

            {/* Activity Log */}
            <Route path="/activity-log" element={<ActivityLogList />} />

            {/* Profile */}
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontSize: '14px' },
          }}
        />
      </WarehouseProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

const PlaceholderPage = ({ title }) => (
  <div>
    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    <p className="text-sm text-gray-500 mt-1">This module will be built in upcoming phases.</p>
  </div>
);

export default App;
