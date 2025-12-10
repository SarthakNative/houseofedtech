// models/Form.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ISubmission {
  _id?: Types.ObjectId;
  data: Record<string, any>;
  submittedAt: Date;
}

export interface IForm extends Document {
  title: string;
  description?: string;
  owner: Schema.Types.ObjectId | string;
  schema: any;
  submissions: ISubmission[];
}

const FormSchema = new Schema<IForm>({
  title: { type: String, required: true },
  description: { type: String },
  owner: { 
    type: Schema.Types.ObjectId, 
    ref: "User",
    required: true
  },
  schema: { type: Object },
  submissions: [{
    data: { type: Object, required: true },
    submittedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default model<IForm>("Form", FormSchema);