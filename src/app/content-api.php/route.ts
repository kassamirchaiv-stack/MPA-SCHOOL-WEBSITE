// Endpoint of the previous site's file-based admin. Permanently retired.
const gone = () =>
  new Response("This endpoint has been retired. The website is now managed at /admin.", {
    status: 410,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });

export const GET = gone;
export const POST = gone;
