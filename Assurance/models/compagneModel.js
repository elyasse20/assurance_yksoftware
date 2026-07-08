// // models/Compagne.js
// import mongoose from 'mongoose';

// const compagneSchema = new mongoose.Schema({
//   compagneName: { type: String, required: true },
//   category: { type: String, required: true },

//   parameters: [
//     {
//       name: { type: String, required: true },
//       percent: { type: Number, required: true, min: 0, max: 100 }
//     }
//   ],
//   indec:{type: String, required: true}
// });

// export default mongoose.model('Compagne', compagneSchema);
// models/Compagne.js
import mongoose from 'mongoose';

const compagneSchema = new mongoose.Schema({
  compagneName: { type: String, required: true },

  categories: [
    {
      name: { type: String, required: true },
      indec: { type: String, required: true },

      parameters: [
        {
          name: { type: String, required: true },
          percent: { type: Number, required: true, min: 0, max: 100 },
        },
      ],
    },
  ],

});

export default mongoose.model("Compagne", compagneSchema);

