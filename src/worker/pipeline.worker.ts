import { createHandler } from "./handler";
import type { FromWorker, ToWorker } from "./protocol";

const scope = self as unknown as {
  onmessage: (event: MessageEvent<ToWorker>) => void;
  postMessage(message: FromWorker, transfer: Transferable[]): void;
};

const handle = createHandler((message, transfer) => scope.postMessage(message, transfer ?? []));
scope.onmessage = ({ data }) => void handle(data);
