import request from "@/utils/request";
import AuthAPI from "@/api/auth";
import type {
  UserQueryParams,
  UserItem,
  UserForm,
  UserDetail,
  AssignRolesRequest,
  AssignDataScopeRequest,
  ResetPasswordRequest,
  UserProfileDetail,
  UserProfileForm,
  PasswordChangeForm,
  MobileUpdateForm,
  EmailUpdateForm,
} from "./types";
import type { PageResult, OptionItem } from "@/api/common";
import type { ExcelResult } from "@/api/common";

const USER_BASE_URL = "/api/v1/users";

const UserAPI = {
  /** 获取用户分页列表 */
  getPage(queryParams: UserQueryParams) {
    return request<unknown, PageResult<UserItem>>({
      url: `${USER_BASE_URL}`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取用户下拉选项 */
  async getOptions(queryParams?: UserQueryParams): Promise<OptionItem[]> {
    const data = await UserAPI.getPage({
      ...queryParams,
      page: 1,
      pageSize: 0,
    });
    return (data.items ?? []).map((item) => ({
      value: item.id,
      label: item.nickname || item.username,
    }));
  },

  /** 获取用户详情（含角色ID列表） */
  getDetail(id: string) {
    return request<unknown, UserDetail>({
      url: `${USER_BASE_URL}/${id}`,
      method: "get",
    });
  },

  /** 获取用户表单数据（编辑回显） */
  getFormData(id: string) {
    return request<unknown, UserDetail>({
      url: `${USER_BASE_URL}/${id}`,
      method: "get",
    });
  },

  /** 新增用户 */
  create(data: UserForm) {
    return request({
      url: `${USER_BASE_URL}`,
      method: "post",
      data,
    });
  },

  /** 修改用户 */
  update(id: string, data: Partial<UserForm>) {
    return request({
      url: `${USER_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /** 删除用户 */
  deleteById(id: string) {
    return request({
      url: `${USER_BASE_URL}/${id}`,
      method: "delete",
    });
  },

  /** 批量删除用户 */
  deleteByIds(ids: string) {
    return request({
      url: `${USER_BASE_URL}/${ids}`,
      method: "delete",
    });
  },

  /** 导出用户数据 */
  export(queryParams?: UserQueryParams) {
    return request({
      url: `${USER_BASE_URL}/export`,
      method: "get",
      params: queryParams,
      responseType: "blob",
    });
  },

  /** 下载导入模板 */
  downloadTemplate() {
    return request({
      url: `${USER_BASE_URL}/template`,
      method: "get",
      responseType: "blob",
    });
  },

  /** 导入用户数据 */
  import(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<unknown, ExcelResult>({
      url: `${USER_BASE_URL}/import`,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** 分配角色 */
  assignRoles(id: string, data: AssignRolesRequest) {
    return request({
      url: `${USER_BASE_URL}/${id}/roles`,
      method: "put",
      data,
    });
  },

  /** 设置数据范围 */
  assignDataScope(id: string, data: AssignDataScopeRequest) {
    return request({
      url: `${USER_BASE_URL}/${id}/data-scope`,
      method: "put",
      data,
    });
  },

  /** 重置密码 */
  resetPassword(id: string, data: ResetPasswordRequest) {
    return request({
      url: `${USER_BASE_URL}/${id}/password`,
      method: "put",
      data,
    });
  },

  // ============================================
  // 以下方法用于个人中心页面（部分功能后端暂未实现）
  // ============================================

  /** 获取当前登录用户详情（个人中心用） */
  async getProfile(): Promise<UserProfileDetail> {
    const profile = await AuthAPI.getProfile();
    return {
      id: profile.id,
      userId: profile.id,
      username: profile.username,
      nickname: profile.nickname,
      realName: profile.realName,
      avatarFileId: profile.avatarFileId,
      email: profile.email,
      mobile: profile.phone,
      phone: profile.phone,
      gender: profile.gender,
      deptId: profile.deptId,
      deptName: profile.deptName,
      roles: profile.roles,
      roleNames: (profile.roles ?? []).join("、"),
      perms: profile.permissions,
    };
  },

  /** 修改个人资料 */
  async updateProfile(data: UserProfileForm): Promise<void> {
    const profile = await AuthAPI.getProfile();
    await request({
      url: `${USER_BASE_URL}/${profile.id}`,
      method: "put",
      data,
    });
  },

  /** 修改密码（后端暂未提供自助修改密码接口） */
  async changePassword(_data: PasswordChangeForm): Promise<void> {
    ElMessage.warning("修改密码功能暂未开放，请联系管理员重置密码");
  },

  /** 发送手机验证码（后端暂未实现） */
  async sendMobileCode(_mobile: string): Promise<void> {
    ElMessage.warning("短信验证码功能暂未开放");
  },

  /** 绑定/更换手机号（后端暂未实现） */
  async bindOrChangeMobile(_data: MobileUpdateForm): Promise<void> {
    ElMessage.warning("手机号绑定功能暂未开放");
  },

  /** 解绑手机号（后端暂未实现） */
  async unbindMobile(_data: { password: string }): Promise<void> {
    ElMessage.warning("手机号解绑功能暂未开放");
  },

  /** 发送邮箱验证码（后端暂未实现） */
  async sendEmailCode(_email: string): Promise<void> {
    ElMessage.warning("邮箱验证码功能暂未开放");
  },

  /** 绑定/更换邮箱（后端暂未实现） */
  async bindOrChangeEmail(_data: EmailUpdateForm): Promise<void> {
    ElMessage.warning("邮箱绑定功能暂未开放");
  },

  /** 解绑邮箱（后端暂未实现） */
  async unbindEmail(_data: { password: string }): Promise<void> {
    ElMessage.warning("邮箱解绑功能暂未开放");
  },
};

export default UserAPI;

// 重导出类型
export * from "./types";
