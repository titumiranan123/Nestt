# Adding an admin API module

1. Add the module's `resource:action` permission names to `lib/rbac/permissions.ts`; update the role map only when the backend policy supports it.
2. Register each exact backend method and path pattern in `lib/rbac/route-permissions.ts`. Unregistered routes return 403.
3. Create `features/<module>/types.ts`, `api.ts`, `keys.ts`, and `hooks.ts`. Keep backend calls in the feature API and use `apiClient` from its hooks.
4. Build the page from hooks. Use `<Can permission="...">` for actions and let query/mutation metadata drive notices.
5. Add API/UI checks: role access, default-deny paths, query pagination/filter behavior, validation errors, network failure, and mutation invalidation.
6. Confirm the backend enforces the same authorization. Frontend permission checks only improve the UI; they do not replace backend authorization.

Use `features/_template` as the endpoint-free example. It intentionally does not call a real route.
