import type { BaseQueryParams } from "@/api/common";

export interface DictTypeQueryParams extends BaseQueryParams {
  code?: string;
  name?: string;
  status?: number;
}

export interface DictTypeItem {
  id: string;
  code: string;
  name: string;
  status: number;
  isSystem: boolean;
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DictTypeForm {
  id?: string;
  code?: string;
  name?: string;
  status?: number;
  remark?: string;
}

export interface DictItemQueryParams extends BaseQueryParams {
  dictTypeId?: string;
  label?: string;
  value?: string;
  status?: number;
}

export interface DictItem {
  id: string;
  dictTypeId: string;
  label: string;
  value: string;
  color: string | null;
  cssClass: string | null;
  sort: number;
  status: number;
  isDefault: boolean;
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DictItemForm {
  id?: string;
  dictTypeId?: string;
  label?: string;
  value?: string;
  color?: string;
  cssClass?: string;
  sort?: number;
  status?: number;
  isDefault?: boolean;
  remark?: string;
}

export interface DictItemOption {
  id: string;
  value: string;
  label: string;
  color?: string | null;
  cssClass?: string | null;
  isDefault?: boolean;
  sort?: number;
}
