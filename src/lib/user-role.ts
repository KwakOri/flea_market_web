import type {
  EditableUserRole,
  InvitableUserRole,
  UserRole,
} from "@/services/auth.service";

export const userRoleLabels: Record<UserRole, string> = {
  admin: "관리자",
  user: "운영자",
  seller: "셀러",
};

export const invitableUserRoles: Array<{
  label: string;
  value: InvitableUserRole;
}> = [
  { label: userRoleLabels.user, value: "user" },
  { label: userRoleLabels.seller, value: "seller" },
  { label: userRoleLabels.admin, value: "admin" },
];

export const editableUserRoles: Array<{
  label: string;
  value: EditableUserRole;
}> = [
  { label: userRoleLabels.user, value: "user" },
  { label: userRoleLabels.seller, value: "seller" },
];
