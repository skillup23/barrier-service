import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    fullName: {
      lastName: { type: String, default: '' },
      firstName: { type: String, default: '' },
      middleName: { type: String, default: '' },
    },

    address: {
      area: { type: String, required: true },
      street: { type: String, required: true },
      house: { type: String, required: true },
    },

    phones: [
      {
        phone: { type: String, required: true },
        carPlate: { type: String, default: '' },
        carModel: { type: String, default: '' },
      },
    ],

    entranceFeePaid: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'grace', 'disabled'],
      default: 'active',
    },
    paidUntil: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default models.User || model('User', UserSchema);
