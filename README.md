---

# 🛒 Tienda Virtual con Next.js, Supabase y MercadoPago

**Autor**: Dorian García Giraldo
**Fecha**: Julio 2025

---

## 1.Introducción

Proyecto de tienda en línea que permite a usuarios autenticarse, navegar productos, agregar al carrito, realizar pagos con MercadoPago, y gestionar pedidos mediante dashboards de usuario y administrador.
**Tecnologías principales**: Next.js, Supabase (Auth, DB, Storage), TailwindCSS, MercadoPago.

---

## 2.Justificación

* **Next.js** ofrece SSR/CSR optimizados, rendimiento y rutas organizadas.
* **Supabase** aporta autenticación segura, base de datos PostgreSQL y funciones RPC sin backend complejo.
* **MercadoPago** facilita una integración sencilla y flexible en modo sandbox o producción.

---

## 3.Características Principales

•	✅ Registro e inicio de sesión con Supabase Auth.
•	🧑‍💼 Dashboard para usuarios y administradores.
•	🛍️ Carrito persistente asociado a usuarios.
•	📦 CRUD de productos para administradores.
•	💳 Pagos con MercadoPago (sandbox y producción).
•	📉 Descuento automático de stock al pagar.
•	📬 Webhook para confirmar pagos y actualizar pedidos.
•	🔐 Roles: cliente y administrador.
•	📸 Subida de imágenes a Supabase Storage.
•	📱 Interfaz responsiva con TailwindCSS.



## 4.Tecnologías Utilizadas

•	Next.js - Framework React con SSR.
•	Supabase - Backend as a Service (Auth, DB, Storage).
•	TailwindCSS - Estilos modernos.
•	MercadoPago - Plataforma de pagos.
•	PostgreSQL - Base de datos (via Supabase).
•	Ngrok - Webhook testing en desarrollo.


## 3.Arquitectura del Sistema

**Componentes:**

* **Frontend (Next.js)** – página Shop, Cart, Product, Dashboards.
* **API Routes** – endpoints para crear pedidos y comunicarse con MercadoPago/webhook.
* **Supabase** – tablas (users, productos, orders, order\_items, carts, cart\_items).
* **MercadoPago** – manejo de pagos, redirecciones y callbacks.
* **Función RPC** `descontar_stock(product_id, cantidad)`.

**Flujo de pago:**

1. Carrito → Pedido (status: "pendiente")
2. Preferencia de pago generada
3. Usuario paga en MercadoPago
4. Webhook lo confirma → status "pagado", stock descontado, carrito vaciado

---

## 4.Variables de Entorno (.env.local)


•	SUPABASE_URL
•	SUPABASE_SERVICE_ROLE_KEY
•	SUPABASE_ANON_KEY
•	NEXT_PUBLIC_SUPABASE_URL
•	NEXT_PUBLIC_SUPABASE_ANON_KEY
•	MERCADOPAGO_ACCESS_TOKEN
•	MERCADOPAGO_WEBHOOK_URL


## 4.Modelo de Base de Datos
•	usuarios - autenticación (Supabase Auth).
•	productos - catálogo con stock.
•	orders - pedidos realizados.
•	order_items - productos por pedido.
•	carts - carrito persistente.

## 5.Modelo Entidad-Relación (MER)


Tablas principales:

* **usuarios** (id, nombre, email, rol, imagen)
* **productos** (id, nombre, descripcion, precio, stock, imagen\_url)
* **orders** (id, total, user\_id, status, creado\_en)
* **order\_items** (id, order\_id, product\_id, cantidad, precio\_unitario)
* **carts** (id, user\_id, creado\_en)
* **cart\_items** (id, cart\_id, product\_id, cantidad)

**Relaciones:**

* orders.user\_id → usuarios.id
* order\_items.order\_id → orders.id
* order\_items.product\_id → productos.id
* carts.user\_id → usuarios.id
* cart\_items.cart\_id → carts.id

---

## 6.Funcionalidades

* Registro e inicio de sesión (Supabase Auth).
* Dashboard de usuario con historial de pedidos.
* Panel de administración (CRUD productos, gestión usuarios).
* Carrito persistente y sincronizado.
* Proceso de pedido + pago + webhook automático.
* UI responsiva con TailwindCSS y componentes reutilizables.

---

## 7.Detalles Técnicos y Código

### 7.1 Autenticación

* Rutas protegidas con `withAuth` en API/Dashboard.
* Gestión de sesión en `_app.tsx` con `onAuthStateChange` y redirecciones.

### 7.2 Carrito

* `useCart.ts` maneja lógica de añadir, eliminar y actualizar cantidades.
* Persistencia en localStorage y sincronización al iniciar sesión.

### 7.3 Checkout y Pedidos

**pages/cart.tsx**

```ts
const handleCheckout = async () => {
  const createOrderRes = await axios.post('/api/orders/create', { total, items, user_id });
  const { order } = createOrderRes.data;
  const mpRes = await axios.post('/api/mercadopago/create-preference', { items, order_id: order.id });
  window.location.href = mpRes.data.init_point;
};
```

**/api/orders/create.ts**

```ts
const { data: order } = await supabase
  .from('orders')
  .insert({ total, status: 'pendiente', user_id })
  .select('id').single();

const items = cart.map(...);
await supabase.from('order_items').insert(items);
```

**Webhook** `/api/mercadopago/webhook.ts`:

```ts
const payment = await mpClient.get({ id: paymentId });
if (payment.status === 'approved') {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, order_items(product_id, cantidad)')
    .eq('id', orderId).single();

  // Descontar stock
  await Promise.all(order.order_items.map(item =>
    supabaseAdmin.rpc('descontar_stock', {
      product_id: item.product_id,
      cantidad_a_descontar: item.cantidad
    })
  ));

  // Actualizar estado
  await supabaseAdmin.from('orders').update({ status: 'pagado' }).eq('id', orderId);

  // Vaciar carrito
  await supabaseAdmin.from('carts').delete().eq('user_id', order.user_id);
}
```

---

## 8.Función SQL `descontar_stock`

```sql
create or replace function descontar_stock(
  product_id uuid,
  cantidad_a_descontar integer
) returns void language plpgsql as $$
begin
  update productos
    set stock = stock - cantidad_a_descontar
    where id = product_id and stock >= cantidad_a_descontar;
  if not found then
    raise exception 'Stock insuficiente';
  end if;
end;
$$;
```

---

## 9.Interfaces y Pantallas

* **Shop**: grid responsivo con `ProductCard`.
* **Product Detail**: foto grande, precio, stock, botón "Añadir al Carrito".
* **Cart**: listado, total, botón "Pagar".
* **Success**: mensaje de confirmación y redirección automática.
* **Dashboard**: menú lateral con pedidos y perfil.

---

## 10.Despliegue

* Se usa **ngrok** en desarrollo para exponer webhook.
* En producción se recomienda **Vercel**, manteniendo sandbox habilitado.
* Variables de entorno necesarias: Supabase, MercadoPago, webhook URL, etc.

---

## 11.Conclusiones y Recomendaciones

* Integración robusta y completa en entorno serverless.
* Posibilidades de ampliación: envío de emails, roles extendidos, multimoneda, más pasarelas.
* A futuro se podría optimizar rendimiento, caché, control de stock en tiempo real.

---

### Apéndices


*Usuario administrador:
	admin@gmail.com
	pass: 123456

*Usuario user 
	user@gmail.com
	pass: 123456

---

## Modo de Pruebas
Para realizar el pago en mercadoPago en modo prueba desde lo local, debes iniciar el servidor ngrok, que es el puente entre tu maquina local y mercadoPago, despues de inicializar debes de configurar la url pública en el webhook de mercado pago:

• inicializar ngrok desde la terminal, en mi caso en visual studio code:
ngrok http 3000

  Además debes de configurar la url pública en .env. Esta URL es dinámica y cambia cada vez que ejecutas el servidor ngrok.
  Ejemplo de url pública
  • NEXT_PUBLIC_SITE_URL= https://75df4872bb1b.ngrok-free.app

•	Se debe usar  tarjetas de prueba y credenciales sandbox al desplegar en Vercel, para ello usa la siguiente tarjeta de crédito de prueba para simular el pago de un pedido en mercadoPago.

tarjeta de prueba en mercadoPago:
visa:
Número: 4013 5406 8274 6260
Vencimiento: 11/30
CVV: 123
Titular: APRO.
Doc identificación: 123456789


### Capturas de MER y proceso de autenticación en supabase

| MER | Diagrama Autenticación en supabase |
|-----|------------------------------------|
| ![MER](/docs/MER.png) | ![Autenticacion](/docs/autenticacion_supabase.png) |



