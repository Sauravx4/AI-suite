# INDOSATI Office Management Suite — Security Specification

## 1. Data Invariants
- All writes require a verified authenticated user (`request.auth != null && request.auth.token.email_verified == true`) or the bootstrapped administrator (`sauravmourya54@gmail.com` with `email_verified == true`).
- Every document (`workspaces/{workspaceId}`, `orders/{orderId}`, `expenses/{expenseId}`) must have an `ownerId` matching `request.auth.uid` on creation and remaining immutable on update.
- All IDs must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters (`isValidId`).
- All strings and lists have strict `.size()` upper bounds to prevent Denial of Wallet attacks.
- `createdAt` must equal `request.time` on creation and remain immutable (`incoming().createdAt == existing().createdAt`) on update; `updatedAt` must equal `request.time`.

## 2. The "Dirty Dozen" Payloads
1. Unauthenticated write to `/workspaces/indosati_main` -> PERMISSION_DENIED
2. Unverified email write (`email_verified: false`) -> PERMISSION_DENIED
3. Spoofed `ownerId` (`ownerId != request.auth.uid`) -> PERMISSION_DENIED
4. Shadow field injection (`isSuperAdmin: true`) -> PERMISSION_DENIED via `.keys().hasOnly()`
5. Mutating immutable `createdAt` or `ownerId` on update -> PERMISSION_DENIED
6. Forged client timestamp (`updatedAt != request.time`) -> PERMISSION_DENIED
7. Oversized `productName` (> 500 chars) -> PERMISSION_DENIED
8. Oversized `description` (> 1000 chars) -> PERMISSION_DENIED
9. Invalid `orderStatus` enum value -> PERMISSION_DENIED
10. Negative `openingBalance` -> PERMISSION_DENIED
11. Unbounded `expenseCategories` array (> 50 items) -> PERMISSION_DENIED
12. Cross-tenant read where `resource.data.ownerId != request.auth.uid` and user is not admin -> PERMISSION_DENIED
