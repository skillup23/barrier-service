import { Schema, model, models } from 'mongoose';

const PaymentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    receiptUrl: { type: String, required: true },
    isEntranceFee: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: '' },
    lastPaymentDate: { type: Date, default: null },

    processedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default models.Payment || model('Payment', PaymentSchema);
