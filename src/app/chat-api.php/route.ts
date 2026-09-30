// Endpoint of the previous site's chatbot. Retired — its answers now live on /faq.
const gone = () =>
  new Response("This endpoint has been retired. See /faq for answers to common questions.", {
    status: 410,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });

export const GET = gone;
export const POST = gone;
