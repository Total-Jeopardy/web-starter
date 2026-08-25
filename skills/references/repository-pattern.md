# Repository Pattern Reference

Repository contracts live under `domain/repositories/`. Concrete implementations
live under `data/repositories/`, compose one or more `data/sources/`, and map
DTOs into domain entities while returning `Result<T,E>`.

```typescript
// domain/repositories/order-repository.ts
import type { Result, ApiError } from '@/core/network/api-result';
import type { Order } from '@/features/orders/domain/entities/order';

export interface OrderRepository {
  getOrder(orderId: string): Promise<Result<Order, ApiError>>;
}

// data/repositories/order-repository-impl.ts
import type { Result, ApiError } from '@/core/network/api-result';
import type { OrderRepository } from '@/features/orders/domain/repositories/order-repository';
import type { OrderRemoteSource } from '@/features/orders/data/sources/order-remote-source';
import type { Order } from '@/features/orders/domain/entities/order';

export class OrderRepositoryImpl implements OrderRepository {
  constructor(private readonly remote: OrderRemoteSource) {}

  async getOrder(orderId: string): Promise<Result<Order, ApiError>> {
    const result = await this.remote.getOrder(orderId);
    if (!result.ok) return result;

    return { ok: true, value: { id: result.value.id, title: result.value.title } };
  }
}
```

Rules:
- no raw `fetch` usage outside `data/sources/` — always go through `core/network/api-client.ts`
- no `try/catch` around `ApiClient` calls for standard request flow; branch on `result.ok`
- no token reads in repositories
- repositories map DTOs into domain entities before returning
