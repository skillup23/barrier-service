import { Schema, model, models } from 'mongoose';

const BarrierQueueSchema = new Schema(
  {
    phone: { type: String, required: true },
    action: { type: String, enum: ['add', 'remove'], required: true },
    reason: { type: String, default: '' },
    userName: { type: String, default: '' },
    isProcessed: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export default models.BarrierQueue || model('BarrierQueue', BarrierQueueSchema);
