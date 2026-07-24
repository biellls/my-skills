# When to Mock

Mock at **system boundaries** only:

- External APIs (payment, email, etc.)
- Databases (sometimes - prefer test DB)
- Time/randomness
- File system (sometimes)

Don't mock:

- Your own classes/modules
- Internal collaborators
- Anything you control

## Designing for Mockability

At system boundaries, design interfaces that are easy to mock:

**1. Use dependency injection**

Pass external dependencies in rather than creating them internally:

```python
import os
from typing import Protocol


class PaymentClient(Protocol):
    def charge(self, amount_cents: int) -> PaymentResult: ...


# Easy to mock
def process_payment(order: Order, payment_client: PaymentClient) -> PaymentResult:
    return payment_client.charge(order.total_cents)


# Hard to mock
def process_payment_with_hidden_client(order: Order) -> PaymentResult:
    client = StripeClient(os.environ["STRIPE_KEY"])
    return client.charge(order.total_cents)
```

**2. Prefer SDK-style interfaces over generic requesters**

Create specific functions for each external operation instead of one generic request function with conditional logic:

```python
from typing import Protocol


# GOOD: Each operation is independently mockable
class UserApi(Protocol):
    def get_user(self, user_id: str) -> User: ...
    def get_orders(self, user_id: str) -> list[Order]: ...
    def create_order(self, data: CreateOrderRequest) -> Order: ...


# BAD: Mocking requires conditional logic inside the mock
class GenericApiClient(Protocol):
    def request(
        self,
        method: str,
        path: str,
        json: dict | None = None,
    ) -> dict: ...
```

The SDK approach means:
- Each mock returns one specific shape
- No conditional logic in test setup
- Easier to see which endpoints a test exercises
- Type safety per endpoint
