const { Cashfree } = require("cashfree-pg");

// Initialize Cashfree with test credentials
// Using hardcoded test credentials temporarily - should be moved to environment variables in production
Cashfree.XClientId = process.env.CASHFREE_APP_ID || "CF256745D26V5Q8DRH1C73B2GCQ0";
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY || "cfsk_ma_test_91917faa134e12e9b40980b7a2481ac0_b5a59d99";
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX; // Use Cashfree.Environment.PRODUCTION for live

export interface CreateOrderData {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerDetails: {
    customerId: string;
    customerEmail: string;
    customerPhone: string;
    customerName: string;
  };
  orderMeta?: {
    return_url?: string;
    notify_url?: string;
  };
}

export async function createCashfreeOrder(data: CreateOrderData) {
  try {
    const request = {
      order_id: data.orderId,
      order_amount: data.orderAmount,
      order_currency: data.orderCurrency,
      customer_details: {
        customer_id: data.customerDetails.customerId,
        customer_email: data.customerDetails.customerEmail,
        customer_phone: data.customerDetails.customerPhone,
        customer_name: data.customerDetails.customerName,
      },
      order_meta: {
        return_url: data.orderMeta?.return_url || `${process.env.BASE_URL || (process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'http://localhost:5000')}/api/payment/return`,
        notify_url: data.orderMeta?.notify_url || `${process.env.BASE_URL || (process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'http://localhost:5000')}/api/payment/webhook`,
      },
    };

    const response = await Cashfree.PGCreateOrder("2023-08-01", request);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create payment order");
  }
}

export async function verifyPayment(orderId: string) {
  try {
    const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message || "Failed to verify payment");
  }
}

export async function getOrderStatus(orderId: string) {
  try {
    const response = await Cashfree.PGFetchOrder("2023-08-01", orderId);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch order status");
  }
}