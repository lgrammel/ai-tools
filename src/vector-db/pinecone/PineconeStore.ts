import { VectorOperationsApi } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/index.js";
import { VectorStore } from "index.js";
import { z } from "zod";
import { Vector } from "../../run/Vector.js";

export class PineconeStore<DATA extends object | undefined>
  implements VectorStore<DATA, PineconeStore<DATA>>
{
  readonly index: VectorOperationsApi;
  readonly namespace?: string;
  readonly schema: z.ZodSchema<DATA>;

  constructor({
    index,
    namespace,
    schema,
  }: {
    index: VectorOperationsApi;
    namespace?: string;
    schema: z.ZodSchema<DATA>;
  }) {
    this.index = index;
    this.namespace = namespace;
    this.schema = schema;
  }

  async upsertMany(
    data: Array<{
      id: string;
      vector: Vector;
      data: DATA;
    }>
  ) {
    this.index.upsert({
      upsertRequest: {
        namespace: this.namespace,
        vectors: data.map((entry) => ({
          id: entry.id,
          values: entry.vector,
          metadata: entry.data,
        })),
      },
    });
  }

  async query({
    queryVector,
    similarityThreshold,
    maxResults,
  }: {
    queryVector: Vector;
    maxResults: number;
    similarityThreshold?: number;
  }): Promise<Array<{ id: string; data: DATA; similarity?: number }>> {
    const { matches } = await this.index.query({
      queryRequest: {
        namespace: this.namespace,
        vector: queryVector,
        topK: maxResults,
        includeMetadata: true,
      },
    });

    if (matches == undefined) {
      return [];
    }

    return matches
      .filter(
        (match) =>
          similarityThreshold == undefined ||
          match.score == undefined ||
          match.score > similarityThreshold
      )
      .map((match) => ({
        id: match.id,
        data: this.schema.parse(match.metadata),
        similarity: match.score,
      }));
  }

  asStore(): PineconeStore<DATA> {
    return this;
  }
}
