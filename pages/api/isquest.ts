//require('@tensorflow/tfjs-node');



import { NextApiHandler } from 'next';
import * as tf from '@tensorflow/tfjs';
import * as tfnlp from '@tensorflow-models/universal-sentence-encoder';

declare const global: any;

const classifyAsQuestion: NextApiHandler = async (req, res) => {
  try {
    const { inputString } = req.body;

    // Load the Universal Sentence Encoder model
    //const model = await tfnlp.load();
    let model = global.model;

    // Convert the input string to an array of embeddings
    const embeddings = await model.embed([inputString]);

    // Get the embeddings for "question" and "statement"
    const questionEmbedding = (await model.embed(['Is this a question?'])) as tf.Tensor;
    const statementEmbedding = (await model.embed(['This is a statement.'])) as tf.Tensor;

    // Calculate the cosine similarity between the input embedding and question/statement embeddings
    const questionSimilarity = cosineSimilarity(embeddings, questionEmbedding);
    const statementSimilarity = cosineSimilarity(embeddings, statementEmbedding);

    // If the cosine similarity with the question embedding is higher than the statement embedding, classify as a question
    const isQuestion = questionSimilarity > statementSimilarity;

    res.status(200).json({ isQuestion });
  } catch (error) {
    console.error('Error classifying as a question:', error);
    res.status(500).json({ error: 'Error classifying as a question' });
  }
};

// Calculate the cosine similarity between two embeddings
function cosineSimilarity(embeddings1: tf.Tensor, embeddings2: tf.Tensor): number {
  const dotProduct = tf.matMul(embeddings1, embeddings2.transpose());
  const norms = tf.norm(embeddings1).mul(tf.norm(embeddings2));
  const similarity = dotProduct.div(norms).dataSync()[0];
  return similarity;
}

export default classifyAsQuestion;
