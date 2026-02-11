export function normalizeQueueUrl(queueUrl: string, sqsEndpoint: string): string {
  try {
    const endpoint = new URL(sqsEndpoint);
    const url = new URL(queueUrl);

    url.protocol = endpoint.protocol;
    url.host = endpoint.host;

    return url.toString();
  } catch {
    return queueUrl;
  }
}
