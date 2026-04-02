/**
 * Generated path route index.
 * Do not make manual changes to generated output.
 */

import type { ApiRootPath } from "./root";
import type { ApiAppHealthCheckPath } from "./app__health-check";
import type { ApiMePath } from "./me";
import type { ApiMeAvatarPath } from "./me__avatar";
import type { ApiUsersPath } from "./users";
import type { ApiOrdersPath } from "./orders";
import type { ApiOrdersIdPath } from "./orders__id";
import type { ApiOrdersOrderIdPaymentsIntentsPath } from "./orders__orderId__payments__intents";
import type { ApiPaymentsIntentsPath } from "./payments__intents";
import type { ApiPaymentsIntentsPaymentIdPath } from "./payments__intents__paymentId";
import type { ApiShipmentsPath } from "./shipments";
import type { ApiShipmentsByOrderOrderIdPath } from "./shipments__by-order__orderId";
import type { ApiShipmentsIdPath } from "./shipments__id";
import type { ApiInventoryItemsPath } from "./inventory__items";
import type { ApiInventoryItemsSkuPath } from "./inventory__items__sku";
import type { ApiInventoryReservationsPath } from "./inventory__reservations";

export interface GeneratedPathEntries {
    "/": ApiRootPath;
    "/app/health-check": ApiAppHealthCheckPath;
    "/me": ApiMePath;
    "/me/avatar": ApiMeAvatarPath;
    "/users": ApiUsersPath;
    "/orders": ApiOrdersPath;
    "/orders/{id}": ApiOrdersIdPath;
    "/orders/{orderId}/payments/intents": ApiOrdersOrderIdPaymentsIntentsPath;
    "/payments/intents": ApiPaymentsIntentsPath;
    "/payments/intents/{paymentId}": ApiPaymentsIntentsPaymentIdPath;
    "/shipments": ApiShipmentsPath;
    "/shipments/by-order/{orderId}": ApiShipmentsByOrderOrderIdPath;
    "/shipments/{id}": ApiShipmentsIdPath;
    "/inventory/items": ApiInventoryItemsPath;
    "/inventory/items/{sku}": ApiInventoryItemsSkuPath;
    "/inventory/reservations": ApiInventoryReservationsPath;
}
