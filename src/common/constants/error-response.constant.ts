export const ERROR_MESSAGES = {
  USER_DEACTIVATED: {
    error: 'USER_DEACTIVATED',
    message: 'User deactivated.',
  },
  EMAIL_ALREADY_REGISTERED: {
    error: 'EMAIL_ALREADY_REGISTERED',
    message: 'Email already registered',
  },
  USER_NOT_FOUND: {
    error: 'USER_NOT_FOUND',
    message: 'No user found with the given email',
  },
  INVALID_CREDENTIALS: {
    error: 'INVALID_CREDENTIALS',
    message: 'Invalid credentials',
  },
  ACCOUNT_DEACTIVATED: {
    error: 'ACCOUNT_DEACTIVATED',
    message: 'Account deactivated',
  },
  INTERNAL_SERVER_ERROR: {
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
  },
  USER_REGISTERED: {
    error: 'USER_REGISTERED',
    message: 'User registered successfully',
  },
  LOGIN_SUCCESS: {
    error: 'LOGIN_SUCCESS',
    message: 'Login successful',
  },
  FORBIDDEN_SELF_STATUS_CHANGE: {
    error: 'FORBIDDEN_SELF_STATUS_CHANGE',
    message: "You can't change your own status",
  },
  ITEM_NOT_FOUND: {
    error: 'ITEM_NOT_FOUND',
    message: 'Item not found',
  },
  ACTIVE_ITEM_NOT_FOUND: {
    error: 'ACTIVE_ITEM_NOT_FOUND',
    message: 'Active item not found',
  },
  RECEIVER_USER_NOT_FOUND: {
    error: 'RECEIVER_USER_NOT_FOUND',
    message: 'Receiver user not found',
  },
  ASSIGN_TO_OWNER_FORBIDDEN: {
    error: 'ASSIGN_TO_OWNER_FORBIDDEN',
    message: 'Cannot assign item to the owner',
  },
  INVALID_INTEREST: {
    error: 'INVALID_INTEREST',
    message: 'Invalid interest or claim',
  },
  INTEREST_ALREADY_EXPRESSED: {
    error: 'INTEREST_ALREADY_EXPRESSED',
    message: 'Interest already expressed',
  },
  OWNER_CANNOT_EXPRESS_INTEREST: {
    error: 'OWNER_CANNOT_EXPRESS_INTEREST',
    message: 'Owner cannot express interest',
  },
  FORBIDDEN_ACCESS: {
    error: 'FORBIDDEN_ACCESS',
    message: 'Forbidden access',
  },
  INTEREST_NOT_FOUND: {
    error: 'INTEREST_NOT_FOUND',
    message: 'Interest or claim not found',
  },
  ITEM_NOT_ACTIVE: {
    error: 'ITEM_NOT_ACTIVE',
    message: 'Item is not active',
  },
  ADMIN_ONLY: {
    error: 'ADMIN_ONLY',
    message: 'Admin access only',
  },
  INVALID_ITEM_TYPE: {
    error: 'INVALID_ITEM_TYPE',
    message: 'Invalid item type',
  },
  ITEM_ALREADY_ASSIGNED: {
    error: 'ITEM_ALREADY_ASSIGNED',
    message: 'Item already assigned',
  },
  VALIDATION_ERROR: {
    error: 'VALIDATION_ERROR',
    message: 'Validation failed',
  },
  FORBIDDEN_OWNERSHIP: {
    error: 'FORBIDDEN_ITEM_OWNERSHIP',
    message: 'You do not own this.',
  },
  INVALID_FILE_TYPE: {
    error: 'INVALID_FILE_TYPE',
    message: 'Invalid file type',
  },
  OLD_PASSWORD_INCORRECT: {
    error: 'OLD_PASSWORD_INCORRECT',
    message: 'Old password is incorrect',
  },
  INVALID_TOKEN: {
    error: 'INVALID_TOKEN',
    message: 'Invalid or expired token',
  },
  CLAIM_NOT_FOUND: {
    error: 'CLAIM_NOT_FOUND',
    message: 'Claim not found',
  },
  UNAUTHORIZED_CHAT_ACCESS: {
    error: 'UNAUTHORIZED_CHAT_ACCESS',
    message: 'Unauthorized chat access',
  },
  UNAUTHORIZED_MESSAGE_SEND: {
    error: 'UNAUTHORIZED_MESSAGE_SEND',
    message: 'Unauthorized to send message',
  },
  CLAIM_REQUIRED: {
    error: 'CLAIM_REQUIRED',
    message: 'CLAIM_REQUIRED',
  },
  ITEM_INTEREST_REQUIRED: {
    error: 'ITEM_INTEREST_REQUIRED',
    message: 'ITEM_INTEREST_REQUIRED',
  },
  CANNOT_MESSAGE_SELF: {
    error: 'CANNOT_MESSAGE_SELF',
    message: 'CANNOT_MESSAGE_SELF',
  },
  PROFILE_NOT_FOUND: {
    error: 'PROFILE_NOT_FOUND',
    message: 'Profile not found',
  },
  NO_PROFILE_PERMISSION: {
    error: 'NO_PROFILE_PERMISSION',
    message: 'No permission to view profile',
  },
  INVALID_PERMISSION_REQUEST: {
    error: 'INVALID_PERMISSION_REQUEST',
    message: 'Invalid permission request',
  },
  PERMISSION_ALREADY_REQUESTED: {
    error: 'PERMISSION_ALREADY_REQUESTED',
    message: 'Permission already requested',
  },
  NOT_REQUEST_OWNER: {
    error: 'NOT_REQUEST_OWNER',
    message: 'Not authorized to approve or deny this request',
  },
  INVALID_INTERACTION: {
    error: 'INVALID_INTERACTION',
    message: 'Invalid claim, interest, or chat interaction',
  },
  REQUEST_TO_SELF_FORBIDDEN: {
    error: 'REQUEST_TO_SELF_FORBIDDEN',
    message: 'Cannot request permission for own profile',
  },
  PERMISSION_REQUEST_NOT_FOUND: {
    error: 'PERMISSION_REQUEST_NOT_FOUND',
    message: 'Permission request not found',
  },
  INVALID_PERMISSION_REQUEST_STATUS: {
    error: 'INVALID_PERMISSION_REQUEST_STATUS',
    message: 'Invalid permission request status',
  },
  CHAT_CREATION_FAILED: {
    error: 'CHAT_CREATION_FAILED',
    message: 'CHAT_CREATION_FAILED',
  },
  NOT_ASSIGNED: {
    error: 'NOT_ASSIGNED',
    message: 'Not assigned to this item',
  },
  ROLE_NOT_FOUND: {
    error: 'ROLE_NOT_FOUND',
    message: 'Role not found',
  },
  ROLE_IN_USE: {
    error: 'ROLE_IN_USE',
    message: 'Role is in use and cannot be deleted',
  },
  UNIQUE_ROLE: {
    error: 'UNIQUE_ROLE',
    message: 'Role with this name already exists',
  },
  UPDATE_ADMIN_ROLE: {
    error: 'UPDATE_ADMIN_ROLE',
    message: 'Cannot update admin role',
  },
  DELETE_ADMIN_ROLE: {
    error: 'DELETE_ADMIN_ROLE:',
    message: 'Cannot delete admin role',
  },
};
