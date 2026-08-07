import { Schema, model, models } from 'mongoose';

const RequestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['change_phone', 'transfer_balance', 'other'],
      required: true,
    },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true },
);

export default models.Request || model('Request', RequestSchema);
