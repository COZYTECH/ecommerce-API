import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import { redis } from "../util/redis.js";
import paypal from "@paypal/checkout-server-sdk";

const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddress } = req.body;

    // Get cart
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ error: "Cart is empty" });

    // Compute total
    const total = cart.items.reduce((acc, i) => acc + i.quantity * i.price, 0); // assuming price in cart

    // PayPal Order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: total.toFixed(2),
          },
          shipping: {
            address: shippingAddress,
          },
        },
      ],
    });

    const order = await client.execute(request);

    // Persist order in DB with "pending" status
    const newOrder = await Order.create({
      userId,
      items: cart.items,
      shippingAddress,
      total,
      paymentMethod: "paypal",
      paymentInfo: { id: order.result.id, status: "pending" },
      status: "pending",
    });

    // Mark idempotency key completed
    await redis.set(req.idempotencyRedisKey, "completed");

    res.json({ paypalOrderId: order.result.id, orderId: newOrder._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
};

export const captureOrder = async (req, res) => {
  try {
    const { paypalOrderId } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    const capture = await client.execute(request);

    const order = await Order.findOne({ "paymentInfo.id": paypalOrderId });
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.paymentInfo.status = "paid";
    order.status = "paid";
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to capture payment" });
  }
};

export const getUserOrders = async (req, res) => {
  const orders = await Order.find({ userId: req.user.userId });
  res.json(orders);
};

export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
};

export const getAllOrders = async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
};

export const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const { status } = req.body;
  order.status = status;
  await order.save();

  res.json(order);
};
