export type Role = 'admin' | 'vendedora' | 'inventarista';

export type Capability =
  | 'viewDashboard'
  | 'manageCatalog'
  | 'managePrices'
  | 'manageStock'
  | 'manageSuppliers'
  | 'viewOrders'
  | 'viewCustomers'
  | 'manageReviews'
  | 'viewReportsSales'
  | 'viewReportsInventory'
  | 'viewReportsCustomers'
  | 'manageUsers';

const ALL: Capability[] = [
  'viewDashboard', 'manageCatalog', 'managePrices', 'manageStock', 'manageSuppliers',
  'viewOrders', 'viewCustomers', 'manageReviews',
  'viewReportsSales', 'viewReportsInventory', 'viewReportsCustomers', 'manageUsers'
];

export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  admin: ALL,
  vendedora: ['viewDashboard', 'viewOrders', 'viewCustomers', 'manageReviews', 'viewReportsSales', 'viewReportsCustomers'],
  inventarista: ['viewDashboard', 'manageCatalog', 'manageStock', 'manageSuppliers', 'viewReportsInventory']
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador/a',
  vendedora: 'Vendedor/a',
  inventarista: 'Inventarista'
};

export function can(role: Role | undefined, cap: Capability): boolean {
  if (!role) return false;
  return ROLE_CAPABILITIES[role]?.includes(cap) ?? false;
}

export function isStaffRole(role: string | undefined): role is Role {
  return role === 'admin' || role === 'vendedora' || role === 'inventarista';
}
