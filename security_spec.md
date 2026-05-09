# Security Specification - Linking

## Data Invariants
1. A budget must have a valid `ownerId` matching the creator's UID.
2. Only members of a budget (owner, editor, viewer) can read the budget.
3. Only the owner or editors can update the budget.
4. Chat history is private to the user.
5. User profile is private to the user.
6. Comments can only be created by members of the parent budget.
7. Timestamps must be server-generated (`request.time`).
8. All string fields must have size limits to prevent abuse.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing (Budget Create)**: Attempt to create a budget with an `ownerId` that doesn't match `request.auth.uid`.
2. **State Shortcutting (Budget Update)**: Attempt to change `ownerId` on an existing budget.
3. **Resource Poisoning (ID Injection)**: Attempt to create a document with a 2KB string as ID.
4. **Unauthorized Read (Foreign Budget)**: Authenticated user attempting to read a budget where they are not in the `members` list.
5. **Unauthorized Write (Viewer member)**: A user with `role: 'viewer'` in the `members` list attempting to update the budget.
6. **Chat Hijacking**: Authenticated user attempting to read/write to `/users/{otherUserId}/chats`.
7. **Profile Manipulation**: Authenticated user attempting to update `/users/{otherUserId}/profile`.
8. **Shadow Field Injection**: Attempting to add a `verified: true` field to a budget document.
9. **Timestamp Spoofing**: Sending a client-side date for `updatedAt` instead of `serverTimestamp()`.
10. **Orphaned Comment**: Attempting to create a comment for a non-existent budget or a budget the user doesn't have access to.
11. **Denial of Wallet (Array Explosion)**: Attempting to update a budget with an array of 5,000 cost items.
12. **Malicious Query Scraping**: Attempting to list all budgets in the system without filtering by membership.

## The Test Runner (Conceptual)
The `firestore.rules.test.ts` would verify that all the above payloads return `PERMISSION_DENIED`.
