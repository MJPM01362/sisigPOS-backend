import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { 
      type: Number, 
      required: true,
      validate: {
        validator: (v) => typeof v === 'number' && !isNaN(v),
        message: props => `Invalid quantity value: ${props.value}`
      }
    },}
  ],
  total: { type: Number, required: true },
  totalCost: { type: Number, default: 0 },
  tip: {type: Number, default: 0},
  paymentMethod: { type: String, enum: ["Cash", "GCash"], required: true },

  gcashCode: { type: String, default: null },

  orderType: { type: String, enum: ["Dine-In", "Delivery", "Takeout"], required: true },

  cashPaid: { type: Number, default: 0 },
  change: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  isVoided: { type: Boolean, default: false },

  isRefunded: { type: Boolean, default: false },
  refundDate: { type: Date },
});

const Order = mongoose.model("Order", orderSchema);
export default Order;