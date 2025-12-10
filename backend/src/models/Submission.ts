import { Schema, model } from 'mongoose';

const SubmissionSchema = new Schema({
  form: { type: Schema.Types.ObjectId, ref: 'Form', required: true },
  // data now contains both regular fields and file URLs
  data: { type: Object, required: true },
  // Store file metadata separately for management
  files: [{
    fieldName: { type: String, required: true },
    urls: [{ 
      url: String, 
      publicId: String,
      fileName: String,
      fileSize: Number,
      mimeType: String
    }],
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

export default model('Submission', SubmissionSchema);