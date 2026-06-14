# API Integration Guide

This document explains every layer of the Axios setup and exactly
what to do to connect the admin panel to a real backend.

---

## Architecture Overview

```
Component / Page
    │  useQuery / useMutation (React Query)
    ▼
dataService.ts / authService.ts      ← swap mock → real here
    │  function calls
    ▼
api.ts  (AxiosBase)                  ← interceptors live here
    │  HTTP requests
    ▼
tokenStorage.ts                      ← localStorage reads/writes
    │
    ▼
logoutCallback.ts                    ← bridges Axios → Redux
    │
    ▼
authSlice.ts (Redux)                 ← single source of auth truth
```

---

## File-by-File Reference

### `src/services/tokenStorage.ts`
Web equivalent of your React Native `UserPrefs` + `MMKV`.

| Function | Purpose |
|---|---|
| `getToken()` | Read access token |
| `saveAccessToken(token)` | Persist access token |
| `removeAccessToken()` | Delete access token |
| `getRefreshToken()` | Read refresh token |
| `saveRefreshToken(token)` | Persist refresh token |
| `removeRefreshToken()` | Delete refresh token |
| `getSavedUser<T>()` | Read persisted user object |
| `saveUser(user)` | Persist user object |
| `clearAllTokens()` | Nuke everything (full logout) |

**Nothing else in the codebase touches `localStorage` directly.**

---

### `src/services/api.ts`  (AxiosBase)

Mirrors your React Native `AxiosBase` exactly:

#### Request interceptor
```
Every outgoing request:
  1. Reads access token via getToken()
  2. Sets Authorization: Bearer <token>
  3. Sets Content-Type: application/json
     (or multipart/form-data if body is FormData)
  4. Logs full request details in DEV mode
```

#### Response interceptor
```
Success → logs response, returns it untouched

401 error → token refresh flow:
  ┌─ Is a refresh already in progress?
  │    YES → park this request in failedQueue, wait
  │    NO  → set isRefreshing = true
  │
  ├─ POST /auth/refresh  (raw axios, NOT AxiosBase — avoids loop)
  │    Headers: { Authorization: Bearer <refreshToken> }
  │
  ├─ SUCCESS:
  │    saveAccessToken(newToken)
  │    flush failedQueue with newToken
  │    retry originalRequest with newToken
  │
  └─ FAILURE:
       processQueue(error)     ← reject all queued requests
       hardLogout()            ← clearAllTokens + dispatch(logout) + redirect /login

Other errors → reject with error.response.data
```

#### Concurrency handling (key difference vs your RN code)
Your RN code handles one 401 at a time. The admin panel adds a
**queue** so if 3 requests all 401 simultaneously, only **one**
refresh call is made and all 3 retry with the new token:

```
Request A ──401──► starts refresh ──────────────────► retry A ✓
Request B ──401──► queued ──► gets new token ────────► retry B ✓
Request C ──401──► queued ──► gets new token ────────► retry C ✓
                    └─── single POST /auth/refresh ───┘
```

---

### `src/services/logoutCallback.ts`

A tiny pub/sub bridge that avoids a circular import between
`api.ts` (a plain module) and Redux.

```ts
// main.tsx — registered once at startup
registerLogoutCallback(() => {
  store.dispatch(logout());
});

// api.ts — called when refresh fails
triggerLogout(); // → fires the callback above
```

---

## Step-by-Step: Switching to a Real Backend

### Step 1 — Set your API URL

```bash
cp .env.example .env
# Edit .env:
VITE_API_URL=https://api.yourapp.com/v1
```

### Step 2 — Update `authService.ts`

Each function has the real call commented right above the mock:

```ts
// BEFORE (mock):
verifyOTP: async (phone, otp) => {
  await new Promise((r) => setTimeout(r, 1000));
  return { user: MOCK_ADMIN, token: 'mock-...', refreshToken: 'mock-...' };
}

// AFTER (real):
verifyOTP: async (phone, otp) => {
  const { data } = await AxiosBase.post('/auth/verify-otp', { phone, otp });
  return {
    user: data.user,
    token: data.accessToken,
    refreshToken: data.refreshToken,
  };
}
```

### Step 3 — Update `dataService.ts`

Same pattern — each function has the real AxiosBase call commented above the mock:

```ts
// BEFORE (mock):
getAll: async (filters) => {
  await delay();
  let data = [...mockUsers];
  // ... filter/sort/paginate mock data
}

// AFTER (real):
getAll: async (filters) => {
  const { data } = await AxiosBase.get('/admin/users', { params: filters });
  return data; // { data[], total, page, limit, totalPages }
}
```

### Step 4 — Update refresh endpoint path

In `api.ts`, line ~95:

```ts
// Change this to match your backend:
const { data } = await axios.post<{ accessToken: string }>(
  '/auth/refresh',   // ← your actual endpoint
  {},
  {
    baseURL: AxiosBase.defaults.baseURL,
    headers: { Authorization: `Bearer ${refreshToken}` },
  },
);
```

If your backend expects the refresh token in the **body** instead of the header:

```ts
const { data } = await axios.post('/auth/refresh', {
  refreshToken,
}, { baseURL: AxiosBase.defaults.baseURL });
```

---

## Expected API Contract

These are the response shapes the frontend expects.
Adjust field names in `dataService.ts` if yours differ.

### POST `/auth/verify-otp`
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "admin-1",
    "name": "Admin User",
    "email": "admin@example.com",
    "phone": "+91-9876500000",
    "role": "admin",
    "status": "active",
    "registrationDate": "2024-01-01",
    "avatar": "https://..."
  }
}
```

### POST `/auth/refresh`
```json
{
  "accessToken": "eyJ..."
}
```

### GET `/admin/users?page=1&limit=8&search=&status=`
```json
{
  "data": [ { ...user } ],
  "total": 100,
  "page": 1,
  "limit": 8,
  "totalPages": 13
}
```

### GET `/admin/orders?page=1&limit=8`
```json
{
  "data": [ { ...order } ],
  "total": 50,
  "page": 1,
  "limit": 8,
  "totalPages": 7
}
```

### GET `/admin/categories`
```json
{
  "categories": [ { ...category } ]
}
```

### GET `/admin/categories/:id/products`
```json
{
  "products": [ { ...product } ]
}
```

---

## FormData / File Uploads

AxiosBase automatically detects `FormData` and sets
`Content-Type: multipart/form-data`.

Example — create product with images:

```ts
// In dataService.ts productsService.create:
const form = new FormData();
form.append('categoryId', payload.categoryId!);
form.append('name', payload.name!);
form.append('description', payload.description!);
form.append('price', String(payload.price));
form.append('stock', String(payload.stock));

// Multiple images
payload.imageFiles?.forEach((file) => form.append('images', file));

const { data } = await AxiosBase.post('/admin/products', form);
// Content-Type is set to multipart/form-data automatically
```

---

## Error Handling

AxiosBase normalises all errors to `error.response.data` shape.
React Query surfaces them in `error` from `useQuery`/`useMutation`.

```ts
const mutation = useMutation({
  mutationFn: usersService.delete,
  onError: (error: any) => {
    // error is already error.response.data from AxiosBase
    toast.error(error?.message || 'Something went wrong');
  },
});
```

For global error handling add a `QueryCache` handler in `main.tsx`:

```ts
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      toast.error(error?.message || 'Request failed');
    },
  }),
});
```

---

## DEV vs PROD Logs

All `console.log` calls in AxiosBase are gated:

```ts
if (import.meta.env.DEV) {
  console.log('========== API REQUEST ==========');
  // ...
}
```

In production builds (`npm run build`) `import.meta.env.DEV` is
`false`, so **zero logs** are shipped to users.

---

## Quick Checklist

- [ ] `cp .env.example .env` and set `VITE_API_URL`
- [ ] Update `/auth/refresh` endpoint path in `api.ts`
- [ ] Uncomment real calls in `authService.ts` (remove mock blocks)
- [ ] Uncomment real calls in `dataService.ts` (remove mock blocks)
- [ ] Verify response field names match your backend (adjust if needed)
- [ ] Test the refresh flow: let access token expire → make a request → watch it silently refresh
- [ ] Test hard logout: invalidate refresh token on server → next request should redirect to `/login`
