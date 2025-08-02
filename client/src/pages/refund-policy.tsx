import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          <h1 className="text-3xl font-bold mb-6">Cancellation & Refund Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated on 02-08-2025 16:31:18</p>

          <div className="space-y-6 text-muted-foreground">
            <p>
              ASHUTOSH LATH believes in helping its customers as far as possible, and has therefore a liberal
              cancellation policy. Under this policy:
            </p>

            <ul className="list-disc pl-6 space-y-4">
              <li>
                Cancellations will be considered only if the request is made immediately after placing the order.
                However, the cancellation request may not be entertained if the orders have been communicated to the
                vendors/merchants and they have initiated the process of shipping them.
              </li>

              <li>
                ASHUTOSH LATH does not accept cancellation requests for perishable items like flowers, eatables
                etc. However, refund/replacement can be made if the customer establishes that the quality of product
                delivered is not good.
              </li>

              <li>
                In case of receipt of damaged or defective items please report the same to our Customer Service team.
                The request will, however, be entertained once the merchant has checked and determined the same at his
                own end. This should be reported within Only same day days of receipt of the products. In case you feel
                that the product received is not as shown on the site or as per your expectations, you must bring it to the
                notice of our customer service within Only same day days of receiving the product. The Customer
                Service Team after looking into your complaint will take an appropriate decision.
              </li>

              <li>
                In case of complaints regarding products that come with a warranty from manufacturers, please refer
                the issue to them. In case of any Refunds approved by the ASHUTOSH LATH, it'll take 1-2 Days days
                for the refund to be processed to the end customer.
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}