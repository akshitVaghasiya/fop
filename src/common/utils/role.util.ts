import { PROTECTED_ROLE_NAMES } from "../constants/protected-roles.constant";

export function isProtectedRole(roleName: string): boolean {
    if (!roleName) return false;

    return PROTECTED_ROLE_NAMES.includes(roleName.toLowerCase());
}

export function isAdminRole(roleName: string): boolean {
    return roleName.toLowerCase() === 'admin';
}