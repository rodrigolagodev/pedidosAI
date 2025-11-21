import { Database } from './database';

export type MembershipRole = Database['public']['Enums']['membership_role'][number];
export type SupplierCategory = Database['public']['Enums']['supplier_category'][number];
export type ItemUnit = Database['public']['Enums']['item_unit'][number];
export type OrderStatus = Database['public']['Enums']['order_status'][number];
export type ContactMethod = Database['public']['Enums']['contact_method'][number];
