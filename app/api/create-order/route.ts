import Razorpay from "razorpay";

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json();

    const amount =
      body.amount;

    const razorpay =
      new Razorpay({
        key_id:
          process.env
            .NEXT_PUBLIC_RAZORPAY_KEY_ID!,

        key_secret:
          process.env
            .RAZORPAY_KEY_SECRET!,
      });

    const order =
      await razorpay.orders.create({
        amount:
          amount * 100,

        currency: "INR",

        receipt:
          `receipt_${Date.now()}`,
      });

    return Response.json(order);

  } catch (error) {

    console.error(error);

    return Response.json(
      {
        error:
          "Failed to create order",
      },
      {
        status: 500,
      }
    );
  }
}