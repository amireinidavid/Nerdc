// This file makes Next.js treat this route as dynamic
// and avoids prerendering attempts that would cause issues with useSearchParams

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Optionally, you can handle direct API requests to this route
export async function GET(request) {
  // This route exists primarily to make the page dynamic
  // Redirect to the actual page
  return Response.redirect(new URL('/payment/verify', request.url));
} 