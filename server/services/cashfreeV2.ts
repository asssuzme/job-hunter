// Cashfree Payment Gateway Service - Direct API Implementation

const CASHFREE_BASE_URL = 'https://sandbox.cashfree.com/pg';
const CASHFREE_CLIENT_ID = process.env.CASHFREE_APP_ID || "CF256745D26V5Q8DRH1C73B2GCQ0";
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_SECRET_KEY || "cfsk_ma_test_91917faa134e12e9b40980b7a2481ac0_b5a59d99";

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

export async function createCashfreeOrderV2(data: CreateOrderData) {
  try {
    const requestBody = {
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

    console.log("Creating Cashfree order with body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_CLIENT_ID,
        'x-client-secret': CASHFREE_CLIENT_SECRET,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log("Cashfree API response status:", response.status);
    console.log("Cashfree API response:", responseText);

    if (!response.ok) {
      throw new Error(`Cashfree API error: ${response.status} - ${responseText}`);
    }

    const responseData = JSON.parse(responseText);
    return responseData;
  } catch (error: any) {
    console.error("Cashfree order creation error:", error);
    throw new Error(error.message || "Failed to create payment order");
  }
}

export async function getOrderStatusV2(orderId: string) {
  try {
    const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': CASHFREE_CLIENT_ID,
        'x-client-secret': CASHFREE_CLIENT_SECRET,
        'x-api-version': '2023-08-01'
      }
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(`Cashfree API error: ${response.status} - ${responseText}`);
    }

    return JSON.parse(responseText);
  } catch (error: any) {
    console.error("Cashfree order status error:", error);
    throw new Error(error.message || "Failed to fetch order status");
  }
}