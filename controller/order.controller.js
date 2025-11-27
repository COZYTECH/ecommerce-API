import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { redis } from "../util/redis.js";
import { getPayPalAccessToken, paypalApi } from "../util/paypalservice.js";
import { updateProductCache, getProductStock } from "../util/inventoryCache.js";
//import { sendLowStockEmail } from "../services/alerts.service.js";

// Redis Cart Utility
const getCartFromRedis = async (userId) => {
  const data = await redis.get(`cart:user:${userId}`);
  return data ? JSON.parse(data) : { items: [] };
};

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const idempotencyKey = req.idempotencyKey;

    const user = await User.findById(userId);
    if (!user?.address)
      return res.status(400).json({ error: "No saved address" });

    const countryMap = {
      Nigeria: "NG",
      UnitedStates: "US",
      Canada: "CA",
    };

    const shippingAddress = {
      address_line_1: user.address.street || "Unknown Street",
      address_line_2: user.address.apartment || "",
      admin_area_2: user.address.city || "Lagos", // City
      admin_area_1: user.address.state || "Lagos", // State
      postal_code: user.address.postalCode || "100001",
      country_code: countryMap[user.address.country] || "US",
    };
    console.log("Mapped shippingAddress:", shippingAddress);

    // 🔹 Get cart from Redis
    const cart = await getCartFromRedis(userId);
    if (!cart?.items?.length)
      return res.status(400).json({ error: "Cart is empty" });

    // 🔹 Check stock
    for (const item of cart.items) {
      const stock = await getProductStock(item.productId);
      if (stock < item.quantity) {
        return res.status(400).json({ error: `${item.name} is OUT OF STOCK` });
      }
    }

    let total = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    const accessToken = await getPayPalAccessToken();

    // Map items without breakdown inside unit_amount
    const itemsWithPrice = await Promise.all(
      cart.items.map(async (i) => {
        const product = await Product.findById(i.productId);
        if (!product) throw new Error(`Product not found: ${i.productId}`);
        return {
          name: product.name,
          quantity: i.quantity.toString(), // PayPal expects string
          unit_amount: {
            currency_code: "USD",
            value: product.price.toFixed(2),
          },
        };
      })
    );

    // Calculate total from items
    total = itemsWithPrice.reduce(
      (acc, i) => acc + parseFloat(i.unit_amount.value) * parseInt(i.quantity),
      0
    );

    // PayPal purchase_units with correct amount.breakdown
    const purchaseUnit = {
      items: itemsWithPrice,
      amount: {
        currency_code: "USD",
        value: total.toFixed(2),
        breakdown: {
          item_total: {
            currency_code: "USD",
            value: total.toFixed(2), // sum of all items
          },
        },
      },
      shipping: { address: shippingAddress },
    };

    total = itemsWithPrice.reduce(
      (acc, i) => acc + parseFloat(i.unit_amount.value) * parseInt(i.quantity),
      0
    );

    // 🔹 Create PayPal Order via Axios
    const response = await paypalApi.post(
      "/v2/checkout/orders",
      {
        intent: "CAPTURE",
        purchase_units: [purchaseUnit],
        application_context: {
          // return_url: `${process.env.FRONTEND_URL}/orders/success`,
          // cancel_url: `${process.env.FRONTEND_URL}/orders/cancel`,
          return_url: "http://localhost:3000/sucesss",
          cancel_url: "http://localhost:3000/failure",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": idempotencyKey,
        },
      }
    );

    const paypalOrderId = response.data.id;

    // 🔹 Persist order
    const newOrder = await Order.create({
      userId,
      items: cart.items,
      shippingAddress,
      total,
      paymentMethod: "paypal",
      paymentInfo: { id: paypalOrderId, status: "pending" },
      status: "pending",
    });

    // 🔹 Inventory update
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      product.countInStock -= item.quantity;
      await product.save();
      await updateProductCache(product._id);
      //await sendLowStockEmail(product);
    }

    // 🔹 Clear Redis cart after order creation
    await redis.del(`cart:user:${userId}`);
    const processed = await redis.get(idempotencyKey);
    if (processed) {
      return res.status(409).json({ message: "Order already processed" });
    }
    await redis.set(idempotencyKey, "completed", { EX: 60 * 60 }); // expires in 1 hour

    res.json({
      orderId: newOrder._id,
      paypalOrderId,
      approvalUrl: response.data.links.find((l) => l.rel === "approve")?.href,
    });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
};

export const captureOrder = async (req, res) => {
  try {
    const { paypalOrderId } = req.body;
    const accessToken = await getPayPalAccessToken();

    const response = await paypalApi.post(
      `/v2/checkout/orders/${paypalOrderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const order = await Order.findOne({ "paymentInfo.id": paypalOrderId });
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.paymentInfo.status = "paid";
    order.status = "paid";
    await order.save();

    res.json({ success: true, order, paypalResponse: response.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to capture payment" });
  }
};

export const paypalSuccess = async (req, res) => {
  const { token } = req.query;
  res.redirect(`${process.env.FRONTEND_URL}/orders/thankyou?orderId=${token}`);
};

export const paypalCancel = async (req, res) => {
  const { token } = req.query;
  const order = await Order.findOne({ "paymentInfo.id": token });
  if (order) {
    order.status = "canceled";
    await order.save();
  }
  res.redirect(`${process.env.FRONTEND_URL}/orders/canceled`);
};
