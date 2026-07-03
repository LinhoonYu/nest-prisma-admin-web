import type { BaseQueryParams, PageResult } from "@/api/common";

export interface PermissionQueryParams extends BaseQueryParams {
  name?: string;
  code?: string;
  group?: string;
  status?: number;
}

export interface PermissionItem {
  id: string;
  code: string;
  name: string;
  group: string | null;
  method: string | null;
  path: string | null;
  sort: number;
  status: number;
  isSystem: boolean;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionForm {
  id?: string;
  code: string;
  name: string;
  group?: string;
  method?: string;
  path?: string;
  sort?: number;
  status?: number;
  remark?: string;
}
