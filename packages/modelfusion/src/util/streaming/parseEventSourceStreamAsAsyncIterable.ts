import { safeParseJSON } from "../../core/schema/parseJSON";
import { Schema } from "../../core/schema/Schema";
import { Delta } from "../../model-function/Delta";
import { AsyncQueue } from "../AsyncQueue";
import { parseEventSourceStream } from "./parseEventSourceStream";

export async function parseEventSourceStreamAsAsyncIterable<T>({
  stream,
  schema,
}: {
  stream: ReadableStream<Uint8Array>;
  schema: Schema<T>;
}): Promise<AsyncIterable<Delta<T>>> {
  const queue = new AsyncQueue<Delta<T>>();

  // process the stream asynchonously (no 'await' on purpose):
  parseEventSourceStream({ stream })
    .then(async (events) => {
      try {
        for await (const event of events) {
          const data = event.data;

          if (data === "[DONE]") {
            queue.close();
            return;
          }

          const parseResult = safeParseJSON({
            text: data,
            schema,
          });

          if (!parseResult.success) {
            queue.push({
              type: "error",
              error: parseResult.error,
            });

            // Note: the queue is not closed on purpose. Some providers might add additional
            // chunks that are not parsable, and ModelFusion should be resilient to that.
            continue;
          }

          const completionChunk = parseResult.value;

          queue.push({
            type: "delta",
            deltaValue: completionChunk,
          });
        }
      } catch (error) {
        queue.push({ type: "error", error });
        queue.close();
        return;
      }
    })
    .catch((error) => {
      queue.push({ type: "error", error });
      queue.close();
      return;
    });

  return queue;
}
