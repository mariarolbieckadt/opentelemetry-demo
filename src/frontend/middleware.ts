import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { v4 } from 'uuid';
  
export function middleware(request: NextRequest) {
const response = NextResponse.next()

// If the SESSIONID cookie is not set, generate a new UUID and set it
if(!request.cookies.has('SESSIONID'))
    response.cookies.set('SESSIONID', v4())

// Set the USERID cookie if it is not set
if(!request.cookies.has('USERID'))
    response.cookies.set('USERID', v4())


// Set the USERID cookie if it is not set
if (!request.cookies.has('USERID')) {
 const userId = v4();
 response.cookies.set('USERID', userId);
 console.log(`USERID set to ${userId}`);
}

console.log(`LALALAAL Middleware executed!!!!`);


return response
}

// Matching paths
export const config = {
matcher: '/:path*',
}